variable "prefix" {
  type    = string
  default = "strategic-companies-list"
}

variable "suffix" {
  type    = string
  default = "prod"
}

variable "vpc_cidr_block" {
  type    = string
  default = "172.16.0.0/16"
}

variable "subnets_public" {
  type = list(object({
    cidr_block              = string
    availability_zone_short = string
  }))
  default = [
    {
      cidr_block              = "172.16.0.0/21"
      availability_zone_short = "a"
    },
    {
      cidr_block              = "172.16.8.0/21"
      availability_zone_short = "b"
    },
    {
      cidr_block              = "172.16.16.0/21"
      availability_zone_short = "c"
    },
  ]
}

variable "subnets_private" {
  type = list(object({
    cidr_block              = string
    availability_zone_short = string
  }))
  default = [
    {
      cidr_block              = "172.16.24.0/21"
      availability_zone_short = "a"
    },
    {
      cidr_block              = "172.16.32.0/21"
      availability_zone_short = "b"
    },
    {
      cidr_block              = "172.16.40.0/21"
      availability_zone_short = "c"
    },
  ]
}
