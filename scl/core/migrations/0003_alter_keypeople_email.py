# Generated by Django 5.1.9 on 2025-05-12 09:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_keypeople_email'),
    ]

    operations = [
        migrations.AlterField(
            model_name='keypeople',
            name='email',
            field=models.EmailField(default='N/A', max_length=254),
        ),
    ]
