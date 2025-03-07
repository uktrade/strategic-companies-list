resource "aws_lb" "main" {
  name            = "${var.prefix}-${var.suffix}"
  subnets         = aws_subnet.public.*.id
  security_groups = ["${aws_security_group.lb.id}"]

  connection_logs {
    bucket  = aws_s3_bucket.lb_connection_logs.id
    enabled = true
  }

  access_logs {
    bucket  = aws_s3_bucket.lb_access_logs.id
    enabled = true
  }

  depends_on = [
    aws_s3_bucket_policy.lb_connection_logs,
    aws_s3_bucket_policy.lb_access_logs,
  ]
}

resource "aws_s3_bucket" "lb_connection_logs" {
  bucket = "${var.prefix}-lb-connection-logs-${var.suffix}"
}

resource "aws_s3_bucket_policy" "lb_connection_logs" {
  bucket = aws_s3_bucket.lb_connection_logs.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          AWS = "arn:aws:iam::${var.aws_lb_account_id}:root"
        },
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.lb_connection_logs.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket" "lb_access_logs" {
  bucket = "${var.prefix}-lb-access-logs-${var.suffix}"
}

resource "aws_s3_bucket_policy" "lb_access_logs" {
  bucket = aws_s3_bucket.lb_access_logs.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          AWS = "arn:aws:iam::${var.aws_lb_account_id}:root"
        },
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.lb_access_logs.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "main_lb_connection_logs" {
  bucket = aws_s3_bucket.lb_connection_logs.id

  rule {
    id     = "delete-after-ten-years"
    status = "Enabled"
    expiration {
      # This is how CloudWatch defines 10 years
      days = 3653
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "main_lb_access_logs" {
  bucket = aws_s3_bucket.lb_access_logs.id

  rule {
    id     = "delete-after-ten-years"
    status = "Enabled"
    expiration {
      # This is how CloudWatch defines 10 years
      days = 3653
    }
  }
}

resource "aws_security_group" "lb" {
  name        = "${var.prefix}-${var.suffix}"
  description = "${var.prefix}-${var.suffix}"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${var.prefix}-${var.suffix}"
  }
}

resource "aws_vpc_security_group_ingress_rule" "lb_from_cloudfront" {
  security_group_id = aws_security_group.lb.id
  prefix_list_id    = data.aws_ec2_managed_prefix_list.cloudfront.id

  ip_protocol = "tcp"
  from_port   = "443"
  to_port     = "443"
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      status_code  = "401"
    }
  }
}

# AWS recommends _both_ the header name and its value are not made public
resource "random_id" "cdn_header_name" {
  byte_length = 16
  prefix      = "x-cdn-"
}

resource "random_bytes" "cdn_header_value" {
  length = 64
}

resource "aws_lb_listener_rule" "lb_healthcheck" {
  # Forbid external requests to /lb-healthcheck, which is not behind SSO or the IP filter
  listener_arn = aws_lb_listener.main.arn
  priority     = 100

  action {
    type = "fixed-response"

    fixed_response {
      status_code  = "403"
      content_type = "text/plain"
    }
  }

  condition {
    path_pattern {
      values = ["/lb-healthcheck"]
    }
  }
}

resource "aws_lb_listener_rule" "main" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 200

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }

  condition {
    host_header {
      values = [var.external_domain_name]
    }
  }

  condition {
    http_header {
      http_header_name = random_id.cdn_header_name.hex
      values           = [random_bytes.cdn_header_value.hex]
    }
  }
}

resource "aws_lb_target_group" "main" {
  name        = "${var.prefix}-${var.suffix}"
  vpc_id      = aws_vpc.main.id
  port        = var.container_port
  protocol    = "HTTP"
  target_type = "ip"

  # The health check is on /, which redirects to SSO since the load balance is not logged in
  health_check {
    matcher = "200,302"
  }
}
