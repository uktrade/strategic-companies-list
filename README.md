# strategic-companies-list

A service for maintaining and securely sharing information on top tier companies.


## Developing

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

AWS infrastructure for running the strategic-companies-list is defined through Terraform in [infra/](./infra/), although each environment needs some manual setup. There are various options, but one possibility:

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

7. In each environment directory, create a `main.tf` as follows, replacing the `<...>`` patterns with the S3 bucket name, DynamoDB table, and environment name.

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
