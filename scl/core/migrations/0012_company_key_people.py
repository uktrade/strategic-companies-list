# Generated by Django 5.1.6 on 2025-03-06 12:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_remove_engagement_company_account_manager_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='company',
            name='key_people',
            field=models.TextField(blank=True, default=''),
        ),
    ]
