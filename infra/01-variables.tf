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

variable "container_port" {
  type    = number
  default = 8000
}

variable "container_name" {
  type    = string
  default = "main"
}

variable "github_source_url" {
  type    = string
  default = "https://github.com/uktrade/strategic-companies-list.git"
}

variable "github_codeconnection_arn" {
  type    = string
  default = ""
}

variable "aws_lb_account_id" {
  # The account ID of the AWS-controlled account that puts ALB connection and access logs into our bucket
  # https://docs.aws.amazon.com/elasticloadbalancing/latest/application/enable-connection-logging.html#attach-bucket-policy-connection
  # https://docs.aws.amazon.com/elasticloadbalancing/latest/application/enable-access-logging.html#attach-bucket-policy
  type    = string
  default = "652711504416"
}

variable "external_domain_name" {
  type = string
}

variable "internal_domain_name" {
  type = string
}

variable "authbroker_url" {
  type = string
}

variable "authbroker_client_id" {
  type = string
}
