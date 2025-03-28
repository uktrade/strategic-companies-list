# Generated by Django 5.1.7 on 2025-03-12 09:04

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0016_rename_details_engagementnote_contents'),
    ]

    operations = [
        migrations.AddField(
            model_name='company',
            name='sectors',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(choices=[('AER', 'Aerospace'), ('AGR', 'Agriculture'), ('AUT', 'Automotive'), ('CHM', 'Chemicals'), ('CON', 'Construction'), ('DEF', 'Defence'), ('EDU', 'Education'), ('ENE', 'Energy'), ('FIN', 'Financial Services'), ('FBT', 'Food & Beverage'), ('HLT', 'Healthcare'), ('ICT', 'Information Technology'), ('MFG', 'Manufacturing'), ('MED', 'Media'), ('MIN', 'Mining'), ('PHR', 'Pharmaceuticals'), ('RET', 'Retail'), ('TEL', 'Telecommunications'), ('TRA', 'Transportation'), ('UTL', 'Utilities')], max_length=3), blank=True, default=list, null=True, size=None, verbose_name='Sectors'),
        ),
        migrations.AddField(
            model_name='companyaccountmanager',
            name='is_lead',
            field=models.BooleanField(default=False),
        ),
        migrations.AddConstraint(
            model_name='companyaccountmanager',
            constraint=models.UniqueConstraint(fields=('company', 'account_manager'), name='company_account_manager'),
        ),
    ]
