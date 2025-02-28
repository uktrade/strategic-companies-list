output "_01_lb_alias" {
  value = "You must make sure that '${var.internal_domain_name}' has an ALIAS record (or similar) pointing to the load balancer at '${aws_lb.main.dns_name}'"
}

output "_02_acm" {
  value = "You must make sure that a Certificate Manager certificate is created for '${var.external_domain_name}'"
}

output "_03_cdn" {
  value = "You must make sure that a CloudFront distribution is setup for '${var.external_domain_name}' with the certificate, and configured with an origin of 'https://${var.internal_domain_name}/'"
}

output "_04_alias" {
  value = "You must make sure that  '${var.external_domain_name}' has an ALIAS (or similar) record pointing to the CloudFront distribution"
}

output "_05_cdn_header" {
  value = "You must make sure that the CloudFront distribution sets the '${random_id.cdn_header_name.hex}' HTTP header to '${random_bytes.cdn_header_value.hex}' (without quotes)"
}

output "_06_address_header" {
  value = "You must make sure that the CloudFront distribution passes the  CloudFront-Viewer-Address header to the load balancer, for example by using the Managed-AllViewerAndCloudFrontHeaders-2022-06 origin request policy"
}
