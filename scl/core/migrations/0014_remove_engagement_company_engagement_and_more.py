# Generated by Django 5.1.6 on 2025-03-06 13:30

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0013_company_global_hq_country_company_global_hq_name_and_more'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='engagement',
            name='company_engagement',
        ),
        migrations.AlterField(
            model_name='engagement',
            name='company',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='engagements', to='core.company'),
        ),
    ]
