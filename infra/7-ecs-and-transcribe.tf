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
  task_role_arn            = aws_iam_role.ecs_task_main_service.arn
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
      environment = [
        {
          name  = "AWS_TRANSCRIBE_ROLE_ARN"
          value = aws_iam_role.transcribe.arn
        },
        {
          name  = "PGHOST"
          value = aws_db_instance.main.address
        },
        {
          name  = "PGPORT"
          value = tostring(aws_db_instance.main.port)
        },
        {
          name  = "PGDATABASE"
          value = aws_db_instance.main.db_name
        },
        {
          name  = "PGUSER"
          value = aws_db_instance.main.username
        }
      ],
      secrets = [
        {
          valueFrom = aws_secretsmanager_secret_version.django_secret_key.arn
          name      = "DJANGO_SECRET_KEY"
        },
        {
          valueFrom = aws_secretsmanager_secret_version.main_db_password.arn
          name      = "PGPASSWORD"
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

resource "aws_secretsmanager_secret" "django_secret_key" {
  name = "${var.prefix}-django-secret-key-${var.suffix}"
}

resource "aws_secretsmanager_secret_version" "django_secret_key" {
  secret_id     = aws_secretsmanager_secret.django_secret_key.id
  secret_string = random_password.django_secret_key.result
}

resource "random_password" "django_secret_key" {
  length           = 64
  special          = true
  override_special = "!@#$%^&*(-_=+)" # Taken from Django source code
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

resource "aws_iam_role_policy" "ecs_task_main_execution" {
  name = "${var.prefix}-task-execution-${var.suffix}"
  role = aws_iam_role.ecs_task_main_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "secretsmanager:ListSecretVersionIds"
        ],
        Resource = [
          aws_secretsmanager_secret.django_secret_key.arn,
          aws_secretsmanager_secret.main_db_password.arn,
        ]
      }
    ]
  })
}

resource "aws_iam_role" "ecs_task_main_service" {
  name = "${var.prefix}-task-service-${var.suffix}"

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

resource "aws_vpc_security_group_egress_rule" "ecs_service_to_main_db" {
  security_group_id            = aws_security_group.ecs_service.id
  referenced_security_group_id = aws_security_group.main_db.id

  ip_protocol = "tcp"
  from_port   = aws_db_instance.main.port
  to_port     = aws_db_instance.main.port
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

resource "aws_iam_role" "transcribe" {
  name = "${var.prefix}-transcrbe-${var.suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          AWS = aws_iam_role.ecs_task_main_service.arn
        },
        Action = "sts:AssumeRole"
      },
    ]
  })
}

resource "aws_iam_role_policy" "transcribe" {
  name = "${var.prefix}-transcribe-${var.suffix}"
  role = aws_iam_role.transcribe.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "transcribe:StartStreamTranscriptionWebSocket",
        ],
        Resource = "*"
      },
    ]
  })
}

resource "aws_db_instance" "main" {
  identifier             = "${var.prefix}-${var.suffix}"
  allocated_storage      = 10
  db_name                = "scl"
  engine                 = "postgres"
  engine_version         = "16.3"
  instance_class         = "db.t3.small"
  username               = "master"
  password               = random_password.main_db_password.result
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.main_db.id]
}

resource "random_password" "main_db_password" {
  length  = 64
  special = false
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.prefix}-${var.suffix}"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.prefix}-${var.suffix}"
  }
}

resource "aws_security_group" "main_db" {
  name        = "${var.prefix}-main-db-${var.suffix}"
  description = "${var.prefix}-main-db-${var.suffix}"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${var.prefix}-main-db-${var.suffix}"
  }
}

resource "aws_vpc_security_group_ingress_rule" "main_db_from_ecs_service" {
  security_group_id            = aws_security_group.main_db.id
  referenced_security_group_id = aws_security_group.ecs_service.id

  ip_protocol = "tcp"
  from_port   = aws_db_instance.main.port
  to_port     = aws_db_instance.main.port
}

resource "aws_secretsmanager_secret" "main_db_password" {
  name = "${var.prefix}-main-db-password-${var.suffix}"
}

resource "aws_secretsmanager_secret_version" "main_db_password" {
  secret_id     = aws_secretsmanager_secret.main_db_password.id
  secret_string = random_password.main_db_password.result
}