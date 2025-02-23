resource "aws_codebuild_project" "main" {
  name         = "${var.prefix}-${var.suffix}"
  description  = "${var.prefix}-${var.suffix}"
  service_role = aws_iam_role.codebuild.arn

  artifacts {
    type = "NO_ARTIFACTS"
  }

  source {
    type            = "GITHUB"
    location        = var.github_source_url
    git_clone_depth = 1

    # Although not seemingly common, it's quite handy for the buildspec to be in the Terraform, so
    # it has access to all of Terraform's resources and variables. It also allows quite fast
    # iteration, because it can be quickly deployed with a `terraform apply`
    buildspec = <<-EOT
      version: 0.2

      phases:
        build:
          commands:
            - aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin ${aws_ecr_repository.main.repository_url}
            - DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build -t ${var.prefix}-${var.suffix} .
            - docker tag ${var.prefix}-${var.suffix}:latest ${aws_ecr_repository.main.repository_url}:latest
            - docker push ${aws_ecr_repository.main.repository_url}:latest
            - aws ecs update-service --cluster ${aws_ecs_cluster.main.name} --service ${aws_ecs_service.main.name} --force-new-deployment
    EOT
  }
  source_version = "main"

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "ECR_URL"
      value = ""
    }

    environment_variable {
      name  = "ECS_CLUSTER"
      value = "SOME_VALUE2"
    }

    environment_variable {
      name  = "ECS_SERVICE"
      value = "SOME_VALUE2"
    }
  }

  logs_config {
    cloudwatch_logs {
      group_name  = aws_cloudwatch_log_group.codebuild.name
      stream_name = "main"
    }
  }
}

resource "aws_iam_role" "codebuild" {
  name = "${var.prefix}-codebuild-${var.suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy" "codebuild" {
  name = "${var.prefix}-codebuild-${var.suffix}"
  role = aws_iam_role.codebuild.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow",
      Resource = [
        "${aws_cloudwatch_log_group.codebuild.arn}",
        "${aws_cloudwatch_log_group.codebuild.arn}:*",
      ],
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
      ],
      }, {
      Effect = "Allow",
      Resource = [
        "*",
      ],
      Action = [
        "ecr:GetAuthorizationToken",
      ],
      }, {
      Effect = "Allow",
      Resource = [
        aws_ecr_repository.main.arn,
      ],
      Action = [
        "ecr:BatchCheckLayerAvailability",
        "ecr:CompleteLayerUpload",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:UploadLayerPart"
      ],
      }, {
      Effect = "Allow",
      Resource = [
        aws_ecs_service.main.id,
      ],
      Action = [
        "ecs:UpdateService",
      ],
    }]
  })
}

resource "aws_cloudwatch_log_group" "codebuild" {
  name              = "${var.prefix}-codebuild-${var.suffix}"
  retention_in_days = "3653"
}
