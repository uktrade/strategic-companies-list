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