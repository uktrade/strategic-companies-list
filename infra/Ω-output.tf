output "lb_alias" {
  value = "You must make sure that '${var.domain_name}' has an ALIAS record (or similar) pointing to '${aws_lb.main.dns_name}'"
}
