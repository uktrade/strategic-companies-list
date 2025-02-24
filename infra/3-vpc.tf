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

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.subnets_public[count.index].cidr_block
  availability_zone = "${data.aws_region.current.name}${var.subnets_public[count.index].availability_zone_short}"

  tags = {
    Name = "${var.prefix}-public-${var.subnets_public[count.index].availability_zone_short}-${var.suffix}"
  }
}

resource "aws_subnet" "private" {
  count = length(var.subnets_private)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.subnets_private[count.index].cidr_block
  availability_zone = "${data.aws_region.current.name}${var.subnets_private[count.index].availability_zone_short}"

  tags = {
    Name = "${var.prefix}-private-${var.subnets_private[count.index].availability_zone_short}-${var.suffix}"
  }
}

resource "aws_eip" "nat" {

  tags = {
    Name = "${var.prefix}-${var.suffix}"
  }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "${var.prefix}-${var.suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = aws_vpc.main.cidr_block
    gateway_id = "local"
  }

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.prefix}-public-${var.suffix}"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = aws_vpc.main.cidr_block
    gateway_id = "local"
  }

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "${var.prefix}-private-${var.suffix}"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(var.subnets_public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(var.subnets_private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}