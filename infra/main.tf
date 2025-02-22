data "aws_region" "current" {}

resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr_block

  tags = {
    Name = "${var.prefix}-${var.suffix}"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.prefix}-${var.suffix}"
  }
}

resource "aws_subnet" "public" {
  count = length(var.subnets_public)

  vpc_id     = aws_vpc.main.id
  cidr_block = var.subnets_public[count.index].cidr_block

  tags = {
    Name = "${var.prefix}-public-${var.subnets_public[count.index].availability_zone_short}-${var.suffix}"
  }
}

resource "aws_subnet" "private" {
  count = length(var.subnets_private)

  vpc_id     = aws_vpc.main.id
  cidr_block = var.subnets_private[count.index].cidr_block

  tags = {
    Name = "${var.prefix}-private-${var.subnets_private[count.index].availability_zone_short}-${var.suffix}"
  }
}
