import random
import reversion

from django.core.management.base import BaseCommand

from scl.core.models import User
from scl.core.tests import factories


class Command(BaseCommand):
    help = "Create a given number of companies and all their related objects"

    def add_arguments(self, parser):
        parser.add_argument("email", nargs="?", type=str)
        parser.add_argument("num_companies", nargs="?", type=int)

    def handle(self, *args, **options):
        user = User.objects.get(email=options["email"])
        test_users = factories.UserFactory.create_batch(10)
        users = ", ".join([f"{u.first_name} {u.last_name}" for u in test_users])
        self.stdout.write(self.style.SUCCESS(f"Created test users: {users}"))

        for i in range(0, options["num_companies"]):
            with reversion.create_revision():
                company = factories.CompanyFactory()

                reversion.set_user(user)

                # make the local user account manager for just a few companies
                if i < 5:
                    acc_manager = factories.CompanyAccountManagerFactory.create(
                        company=company, account_manager=user, is_lead=True
                    )
                else:
                    acc_manager = factories.CompanyAccountManagerFactory.create(
                        company=company,
                        account_manager=random.choice(test_users),
                        is_lead=True,
                    )

                factories.KeyPeopleFactory.create_batch(3, company=company)

                factories.InsightFactory.create_batch(
                    5,
                    company=company,
                    insight_type="company_priority",
                    created_by=random.choice(test_users),
                )
                factories.InsightFactory.create_batch(
                    6,
                    company=company,
                    insight_type="hmg_priority",
                    created_by=random.choice(test_users),
                )

                engagements = factories.EngagementFactory.create_batch(
                    4, company=company
                )
                factories.EngagementNoteFactory.create_batch(
                    3, engagement=engagements[0], created_by=acc_manager.account_manager
                )
                factories.EngagementNoteFactory.create_batch(
                    2, engagement=engagements[1], created_by=user
                )

            self.stdout.write(self.style.SUCCESS(f"Created company {company.name}"))

        self.stdout.write(
            self.style.SUCCESS(f"Created {options['num_companies']} companies")
        )
