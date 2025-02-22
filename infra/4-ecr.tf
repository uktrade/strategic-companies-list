resource "aws_ecr_repository" "main" {
  name = "${var.prefix}-${var.suffix}"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "main" {
  repository = aws_ecr_repository.main.name
  policy     = data.aws_ecr_lifecycle_policy_document.main.json
}

data "aws_ecr_lifecycle_policy_document" "main" {
  # Match 'latest' tag, but expire in 1000 years (so it won't match later rules)...
  rule {
    priority = 1
    selection {
      tag_status       = "tagged"
      tag_pattern_list = ["latest"]
      count_type       = "sinceImagePushed"
      count_unit       = "days"
      count_number     = 365000
    }
  }
  # ... and images that have any other tag, expire in 1 day
  rule {
    priority = 2
    selection {
      tag_status       = "tagged"
      tag_pattern_list = ["*"]
      count_type       = "sinceImagePushed"
      count_unit       = "days"
      count_number     = 1
    }
  }
  # ... and for when we we get untagged images (i.e. their tag was applied to another image),
  # ... expire them after 1 day as well
  rule {
    priority = 3
    selection {
      tag_status   = "untagged"
      count_type   = "sinceImagePushed"
      count_unit   = "days"
      count_number = 1
    }
  }
}
