resource "aws_ecs_cluster" "main" {
  name = "${var.prefix}-${var.suffix}"
}

resource "aws_ecs_service" "main" {
  name            = "${var.prefix}-${var.suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  launch_type     = "FARGATE"
  desired_count   = 1

  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = var.container_name
    container_port   = var.container_port
  }

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs_service.id]
  }
}

resource "aws_ecs_task_definition" "main" {
  family                   = "${var.prefix}-${var.suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 1024
  memory                   = 3072
  execution_role_arn       = aws_iam_role.ecs_task_main_execution.arn
  container_definitions = jsonencode([
    {
      name      = var.container_name
      image     = "${aws_ecr_repository.main.repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
        }
      ],
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs_task.name
          awslogs-region        = data.aws_region.current.name
          awslogs-stream-prefix = var.container_name
        }
      }
    }
  ])
}

resource "aws_cloudwatch_log_group" "ecs_task" {
  name              = "${var.prefix}-ecs-task-${var.suffix}"
  retention_in_days = "3653"
}

resource "aws_iam_role" "ecs_task_main_execution" {
  name = "${var.prefix}-task-execution-${var.suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_main_execution" {
  role       = aws_iam_role.ecs_task_main_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

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

resource "aws_vpc_security_group_ingress_rule" "ecs_service_from_cloudwatch" {
  security_group_id = aws_security_group.lb.id
  prefix_list_id    = data.aws_ec2_managed_prefix_list.cloudfront.id

  ip_protocol = "tcp"
  from_port   = "443"
  to_port     = "443"
}

resource "aws_security_group" "ecs_service" {
  name        = "${var.prefix}-ecs-service-${var.suffix}"
  description = "${var.prefix}-ecs-service-${var.suffix}"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${var.prefix}-ecs-service-${var.suffix}"
  }
}

resource "aws_vpc_security_group_egress_rule" "lb_to_ecs_service" {
  security_group_id            = aws_security_group.lb.id
  referenced_security_group_id = aws_security_group.ecs_service.id

  ip_protocol = "tcp"
  from_port   = var.container_port
  to_port     = var.container_port
}

resource "aws_vpc_security_group_ingress_rule" "ecs_service_from_lb" {
  security_group_id            = aws_security_group.ecs_service.id
  referenced_security_group_id = aws_security_group.lb.id

  ip_protocol = "tcp"
  from_port   = var.container_port
  to_port     = var.container_port
}

# Should be tighter - only needed to pull images from ECR
resource "aws_vpc_security_group_egress_rule" "ecs_service_https_to_all" {
  security_group_id = aws_security_group.ecs_service.id
  cidr_ipv4         = "0.0.0.0/0"

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

resource "aws_lb_listener_rule" "main" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
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
