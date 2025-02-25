output "lb_alias" {
  value = "You must make sure that '${var.domain_name}' has an ALIAS record (or similar) pointing to '${aws_lb.main.dns_name}'"
}

output "cdn_header" {
  value = "You must make sure that CloudFront sets the '${random_id.cdn_header_name.hex}' HTTP header to '${random_bytes.cdn_header_value.hex}' (without quotes)"
}
