<p align="center">
  <img alt="Strategic Companies List logo" width="180" height="180" src="./.assets/scl-logo.svg">
</p>

<h3 align="center">Strategic Companies List</h3><p align="center"><em>A service for maintaining and securely sharing information on top tier companies</em></p>

----

### Contents

- [Running locally](#running-locally)
- [Setting up AWS Transcribe locally](#setting-up-aws-transcribe-locally)
- [Creating migrations](#creating-migrations)
- [Architecture (network) diagram](#architecture-network-diagram)
- [Infrastructure naming](#infrastructure-naming)
- [Logs](#logs)
- [Provisioning infrastructure](#provisioning-infrastructure)
- [Licenses and attributions](#licenses-and-attributions)

----

## Running locally

```bash
cp sample.env .env
docker compose down && docker compose up --build
```

Visit http://localhost:8000/. Note that on every start of the application, a (mock) SSO user is created or updated with access to the site through the Django group 'Basic access', as well as staff and superuser access, and this user is automatically logged in.

The above uses a development config, which has differences to production around this user setup and around static assets. To use a config closer to production run:

```bash
cp sample.env .env
docker compose down && docker compose --profile prod up --build
```

### Setting up AWS Transcribe locally

The application uses streaming AWS Transcribe in the browser for speech-to-text functionality, with the browser fetching temporary AWS credentials that are [generated on the server](scl/core/views/api.py) via one or more [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) requests to communicate directly with AWS Transcribe in eu-west-2 using WebSockets.

The server itself uses its _own_ set of temporary credentials to allow [boto3's assume_role](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/sts/client/assume_role.html) to generate the temporary credentials that are provided to the browser. When deployed to ECS, the server gets its temporary credentials by boto3 fetching them from the _link_local_ HTTP endpoint http://169.254.170.2 under the hood.

A similar flow be configured locally, but instead of involving an HTTP endpoint, it uses temporary credentials associated with your SSO AWS role to provide code in a locally running SCIT server another set of temporary credentials, which are in turn used to generate a _third_ set of temporary credentials that are exposed to the browser. It takes a few steps to setup:

1. Make sure you have SSO access to a **non-production** AWS account, and your AWS CLI if configured to use it via a profile in your `~/.aws/config`. It is beyond the scope of these instructions to explain how to set this up, but this should result with a section that starts like the following in your `~/.aws/config` file:

   ```
   [profile data-infrastructure]
   region = eu-west-2
   # ...
   ```
   The name of the profile, in the above example `data-infrastructure`, can be anything you like, but it is typically helpful for it to match name of the AWS account. If you use a different name, replace `data-infrastructure` with the name you choose in the following steps.

2. Login with this profile:

   ```bash
   AWS_PROFILE=data-infrastructure aws sso login
   ```

3. Find and take note of the ARN of your SSO role by running:

   ```bash
   AWS_PROFILE=data-infrastructure aws sts get-caller-identity
   ```

4. In the account, create (or ensure exists) a role called `scit-local`. In its trust policy make sure there is a statement that grants your role from Step 3 the permission to assume it:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Principal": {
         "AWS": "The ARN of your SSO role in Step 3"
       },
       "Action": "sts:AssumeRole"
     }]
   }
   ```

   This role emulates the role that the SCIT service assumes when deployed to ECS. At the time of writing, no permission policies are needed by it.

5. Take note of the ARN of this role.

6. In the account, create (or ensure exists) a role called `scit-local-transcribe`. Make sure it has the following trust policy that allows `scit-local` to assume it.


   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Sid": "Statement1",
       "Effect": "Allow",
       "Principal": {
         "AWS": "The ARN of the scit-local role noted in Step 5"
       },
       "Action": "sts:AssumeRole"
     }]
   }
   ```
   and make sure it has an attached (possibly inline) policy that allows it to start transcription.
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
     "Effect": "Allow",
       "Action": "transcribe:StartStreamTranscriptionWebSocket",
       "Resource": "*"
     }]
   }
   ```

7. Take note of the ARN of this role.

8. In your `~/.aws/config` file create (or ensure exists) another profile `data-infrastructure-scit-local`

   ```
   [profile data-infrastructure-scit-local]
   region = eu-west-2
   sts_regional_endpoints = regional
   source_profile=data-infrastructure
   role_arn=The ARN of the scit-local role noted in Step 5
   ```

   The name `data-infrastructure-scit-local` can be anything you like, but if it's different in the following step replace `data-infrastructure-scit-local` with the name you choose.

9. In the `.env` file have `AWS_PROFILE` and `AWS_TRANSCRIBE_ROLE_ARN` defined as follows:

   ```bash
   AWS_PROFILE=data-infrastructure-scit-local
   AWS_TRANSCRIBE_ROLE_ARN=The ARN of the scit-local-transcribe role noted in Step 7
   ```

If curious, boto3 inside the Docker container has access to your `~/.aws/` folder via a volume defined in [compose.yaml](./compose.yaml).


## Creating migrations

```bash
docker compose run --build web-dev python manage.py makemigrations
```


## Architecture (network) diagram

How the infrastructure components are connected together can be seen in the following network diagram.

![Strategic Companies List network diagram](./.assets/scl-network-diagram.svg)


## Infrastructure naming

All infrastructure is named in the pattern `<prefix>-<name>-<suffix>`.

  - `<prefix>` is the name of the service, by default `strategic-companies-list`
  - `<name>` is an optional descriptive name for the specific piece of infrastructure
  - `<suffix>` is the name of the environment, for example `prod`

For example, the name of the production ECS cluster would be `strategic-companies-list-prod`.


## Logs

There are 9 types of logs, sent to 7 locations:

- VPC flow log, saved to the S3 bucket: `<prefix>-vpc-flow-log-<suffix>`
- ALB connection logs, saved to the S3 bucket `<prefix>-lb-connection-logs-<suffix>`
- ALB access logs sent, ot the S3 bucket `<prefix>-lb-access-logs-<suffix>`
- Logs from standard out and standard error of the ECS task itself, saved to the CloudWatch log group  `<prefix>-ecs-task-<suffix>`. These contain:
  - nginx logs, configured to use the CloudFront-Viewer-Address header for its IP address
  - Web server logs
  - Django logs
- PostgreSQL logs for the PostgreSQL database, saved to the CloudWatch log group `/aws/rds/instance/<prefix>-<suffix>/postgresql`
- Upgrade logs for the PostgreSQL database, saved to the CloudWatch log group `/aws/rds/instance/<prefix>-<suffix>/upgrade`
- Logs from CodeBuild, saved to the CloudWatch log group `<prefix>-codebuild-<suffix>`

Both CloudWatch and S3 logs have a retention of 3653 days (~10 years).


## Provisioning infrastructure

> [!IMPORTANT]
> The instructions below use Terraform to provision infrastructure for Strategic Companies List environments (dev, prod, etc), the "entry-point" of each is an internet-facing Application Load Balancer (ALB). However, for flexibility, especially in multi-account setups, there are manual steps needed after the Terraform has run to make this ALB actually acessible. Be sure to run `terraform output strategic_companies_list` after provisioning the environment to find what these steps are.
>
> Note that manual changes to secrets in AWS Secrets manager typically feed a forced deployment of the ECS service to take effect.
>
> In future versions it is possible that these steps are incorportated into the Terraform.

AWS infrastructure for running the strategic-companies-list is defined through Terraform in [infra/](./infra/), although each environment needs manual bootstrapping. There are various options, but one possibility:

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

      external_domain_name = "scl.my-domain.gov.uk"        # The user-facing domain
      internal_domain_name = "scl.prod.my-domain.digital"  # The domain of the ALB

      authbroker_url       = "https://sso-domain.gov.uk"   # The URL of Staff SSO
      authbroker_client_id = "12345abcdef"                 # The Client ID of the app in Staff SSO
    }

    output "strategic_companies_list" {
      value     = module.strategic_companies_list
      sensitive = true
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

10. Find the manual steps needed:

   ```bash
   AWS_PROFILE=my-profile-name terraform output strategic_companies_list
   ```

11. (Optional) Use [direnv](https://direnv.net/) to avoid having to use `AWS_PROFILE=my-profile-name` for future terraform commands.


## Licenses and attributions

The code of Strategic Companies List is licensed under the [MIT License](./LICENSE).

However, the [Secure Companies List logo](./assets/scl-logo.svg) is not licensed in the MIT License: it is a modified version of [Nursila's strategy icon](https://thenounproject.com/icon/strategy-7052985/), purchased via a Noun project subscription.
