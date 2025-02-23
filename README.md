<p align="center">
  <img alt="Strategic Companies List logo" width="180" height="180" src="./.assets/scl-logo.svg">
</p>

<h3 align="center">Strategic Companies List</h3><p align="center"><em>A service for maintaining and securely sharing information on top tier companies</em></p>

----

### Contents

- [Running locally](#running-locally)
- [Provisioning infrastructure](#provisioning-infrastructure)
- [Licenses and attributions](#licenses-and-attributions)

----

## Running locally

Install dependencies: GOV.UK Design System and a local web server:

```bash
npm install
npm install -g local-web-server
```

Run the local web server:

```bash
ws --rewrite '/assets/(.*) -> /node_modules/govuk-frontend/dist/govuk/assets/$1' --rewrite '/stylesheets/(.*) -> /node_modules/govuk-frontend/dist/govuk/$1' --rewrite '/javascripts/(.*) -> /node_modules/govuk-frontend/dist/govuk/$1'
```

Visit http://localhost:8000/


## Provisioning infrastructure

> [!IMPORTANT]
> The instructions below use Terraform to provision the infrastructure for Strategic Companies List, the "entry-point" of which is an internet-facing Application Load Balancer (ALB). However, it is assumed this ALB is the origin of a CloudFront distribution, but this CloudFront distribution, as well as the DNS records for it and the ABL, are currently _not_ defined in the Terraform, and so must be provisioned separately. While potentially awkard when setting up each environment, it allows for flexibility. For example, they can be setup in another AWS account by other users.
>
> In future versions it is possible that the CloudFront distribution and DNS records are provisioned using the Terraform in this repository.

AWS infrastructure for running the strategic-companies-list is defined through Terraform in [infra/](./infra/), although each environment (dev, prod, etc) needs manual bootstrapping. There are various options, but one possibility:

1. Create or get access to an AWS account for running the infrastructure.

2. Install the [AWS CLI](https://aws.amazon.com/cli/) if you don't have it already.

3. Create an AWS profile configured for the AWS CLI, for example `my-profile-name`. See the the [AWS Cli documentation](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-quickstart.html) for more details.

4. For each environment, create an S3 bucket of any name (for storing the Terraform state file).

5. For each environment, create a DynamoDB table of any name, and with a a string `LockID` partition key (for storing a _lock_ that prevents multiple changes to infrastructure at once).

6. For each environment, create a directory _outside_ of a cloned copy of this repository. A typical file layout would be the following.

   ```
    any-folder
      ├── stategic-companies-list (a cloned copy of this repository)
      └── stategic-companies-list-deploy
          ├── dev
          └── prod
    ```

7. In each environment directory, create a `main.tf` as follows, replacing the `<...>`` patterns with the S3 bucket name, DynamoDB table, and environment name, and populating the `module` with additional variables defined in [infra/variables.tf](./infra/variables.tf)

    ```hcl
    terraform {
      backend "s3" {
        region         = "eu-west-2"
        encrypt        = true
        bucket         = "<bucket)name>"
        key            = "<environment_name>.tfstate"
        dynamodb_table = "<dynamodb_table_name>"
      }
    }

    provider "aws" {
      region = "eu-west-2"
    }

    module "strategic_companies_list" {
      source = "../../strategic-companies-list/infra"
    }

    output "strategic_companies_list" {
      value = module.strategic_companies_list
    }
    ```

8. If you configured AWS CLI though SSO access, run:

   ```bash
   AWS_PROFILE=my-profile-name aws sso login
   ```

9. In each new environment's directory run

   ```bash
   AWS_PROFILE=my-profile-name terraform init
   ```

   and then

   ```bash
   AWS_PROFILE=my-profile-name terraform apply
   ```

10. (Optional) Use [direnv](https://direnv.net/) to avoid having to use `AWS_PROFILE=my-profile-name` for future terraform commands.


# Licenses and attributions

The code of Strategic Companies List is licensed under the [MIT License](./LICENSE).

However, the [Secure Companies List logo](./assets/scl-logo.svg) is not licensed in the MIT License: it is a modified version of [Nursila's strategy icon](https://thenounproject.com/icon/strategy-7052985/), purchased via a Noun project subscription.
