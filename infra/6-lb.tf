resource "aws_lb" "main" {
  name            = "${var.prefix}-${var.suffix}"
  subnets         = aws_subnet.public.*.id
  security_groups = ["${aws_security_group.lb.id}"]
}

resource "aws_security_group" "lb" {
  name        = "${var.prefix}-${var.suffix}"
  description = "${var.prefix}-${var.suffix}"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${var.prefix}-${var.suffix}"
  }
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

resource "aws_lb_listener_rule" "main" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 100

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
}
