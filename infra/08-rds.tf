locals {
  main_db_identifier = "${var.prefix}-${var.suffix}"
}

resource "aws_db_instance" "main" {
  identifier             = local.main_db_identifier
  allocated_storage      = 10
  storage_encrypted      = true
  db_name                = "scl"
  engine                 = "postgres"
  engine_version         = "16.3"
  instance_class         = "db.t3.small"
  username               = "master"
  password_wo            = random_password.main_db_password.result
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.main_db.id]

  backup_retention_period = 35

  # In most AWS resource, we configure with an explicit log group, but in this case AWS specifies
  # the log group. And in order to set retention, we need to make sure they're created before the
  # database
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  depends_on = [
    aws_cloudwatch_log_group.main_db_postgresql,
    aws_cloudwatch_log_group.main_db_upgrade,
  ]

  lifecycle {
    ignore_changes = [engine_version]
  }
}

resource "random_password" "main_db_password" {
  length  = 64
  special = false
}

resource "aws_secretsmanager_secret" "main_db_password" {
  name = "${var.prefix}-main-db-password-${var.suffix}"
}

resource "aws_secretsmanager_secret_version" "main_db_password" {
  secret_id        = aws_secretsmanager_secret.main_db_password.id
  secret_string_wo = random_password.main_db_password.result
}

resource "aws_cloudwatch_log_group" "main_db_postgresql" {
  name              = "/aws/rds/instance/${local.main_db_identifier}/postgresql"
  retention_in_days = "3653"
}

resource "aws_cloudwatch_log_group" "main_db_upgrade" {
  name              = "/aws/rds/instance/${local.main_db_identifier}/upgrade"
  retention_in_days = "3653"
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
