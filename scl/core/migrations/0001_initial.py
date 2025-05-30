# Generated by Django 5.1.7 on 2025-04-08 13:22

import django.contrib.auth.models
import django.contrib.auth.validators
import django.contrib.postgres.fields
import django.db.models.deletion
import django.utils.timezone
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='Company',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('last_updated', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=128)),
                ('duns_number', models.CharField(max_length=9, verbose_name='DUNS number')),
                ('summary', models.TextField(blank=True, max_length=500, null=True)),
                ('global_hq_name', models.CharField(blank=True, default='', max_length=128, verbose_name='Global HQ name')),
                ('global_hq_country', models.CharField(blank=True, choices=[('AE-AZ', 'Abu Dhabi'), ('AF', 'Afghanistan'), ('AE-AJ', 'Ajman'), ('XQZ', 'Akrotiri'), ('AX', 'Åland Islands'), ('AL', 'Albania'), ('DZ', 'Algeria'), ('AS', 'American Samoa'), ('AD', 'Andorra'), ('AO', 'Angola'), ('AI', 'Anguilla'), ('AG', 'Antigua and Barbuda'), ('AR', 'Argentina'), ('AM', 'Armenia'), ('AW', 'Aruba'), ('SH-AC', 'Ascension'), ('AU', 'Australia'), ('AT', 'Austria'), ('AZ', 'Azerbaijan'), ('BH', 'Bahrain'), ('UM-81', 'Baker Island'), ('BD', 'Bangladesh'), ('BB', 'Barbados'), ('BY', 'Belarus'), ('BE', 'Belgium'), ('BZ', 'Belize'), ('BJ', 'Benin'), ('BM', 'Bermuda'), ('BT', 'Bhutan'), ('BO', 'Bolivia'), ('BQ-BO', 'Bonaire'), ('BA', 'Bosnia and Herzegovina'), ('BW', 'Botswana'), ('BR', 'Brazil'), ('IO', 'British Indian Ocean Territory'), ('VG', 'British Virgin Islands'), ('BN', 'Brunei'), ('BG', 'Bulgaria'), ('BF', 'Burkina Faso'), ('BI', 'Burundi'), ('KH', 'Cambodia'), ('CM', 'Cameroon'), ('CA', 'Canada'), ('CV', 'Cape Verde'), ('KY', 'Cayman Islands'), ('CF', 'Central African Republic'), ('ES-CE', 'Ceuta'), ('TD', 'Chad'), ('CL', 'Chile'), ('CN', 'China'), ('CX', 'Christmas Island'), ('CC', 'Cocos (Keeling) Islands'), ('CO', 'Colombia'), ('KM', 'Comoros'), ('CG', 'Congo'), ('CD', 'Congo (Democratic Republic)'), ('CK', 'Cook Islands'), ('CR', 'Costa Rica'), ('HR', 'Croatia'), ('CU', 'Cuba'), ('CW', 'Curaçao'), ('CY', 'Cyprus'), ('CZ', 'Czechia'), ('DK', 'Denmark'), ('XXD', 'Dhekelia'), ('DJ', 'Djibouti'), ('DM', 'Dominica'), ('DO', 'Dominican Republic'), ('AE-DU', 'Dubai'), ('TL', 'East Timor'), ('EC', 'Ecuador'), ('EG', 'Egypt'), ('SV', 'El Salvador'), ('GQ', 'Equatorial Guinea'), ('ER', 'Eritrea'), ('EE', 'Estonia'), ('SZ', 'Eswatini'), ('ET', 'Ethiopia'), ('FK', 'Falkland Islands'), ('FO', 'Faroe Islands'), ('FM', 'Federated States of Micronesia’'), ('FJ', 'Fiji'), ('FI', 'Finland'), ('FR', 'France'), ('GF', 'French Guiana'), ('PF', 'French Polynesia'), ('AE-FU', 'Fujairah'), ('GA', 'Gabon'), ('GE', 'Georgia'), ('DE', 'Germany'), ('GH', 'Ghana'), ('GI', 'Gibraltar'), ('GR', 'Greece'), ('GL', 'Greenland'), ('GD', 'Grenada'), ('GP', 'Guadeloupe'), ('GU', 'Guam'), ('GT', 'Guatemala'), ('GG', 'Guernsey'), ('GN', 'Guinea'), ('GW', 'Guinea-Bissau'), ('GY', 'Guyana'), ('HT', 'Haiti'), ('HN', 'Honduras'), ('HK', 'Hong Kong'), ('UM-84', 'Howland Island'), ('HU', 'Hungary'), ('IS', 'Iceland'), ('IN', 'India'), ('ID', 'Indonesia'), ('IR', 'Iran'), ('IQ', 'Iraq'), ('IE', 'Ireland'), ('IM', 'Isle of Man'), ('IL', 'Israel'), ('IT', 'Italy'), ('CI', 'Ivory Coast'), ('JM', 'Jamaica'), ('JP', 'Japan'), ('UM-86', 'Jarvis Island'), ('JE', 'Jersey'), ('UM-67', 'Johnston Atoll'), ('JO', 'Jordan'), ('KZ', 'Kazakhstan'), ('KE', 'Kenya'), ('UM-89', 'Kingman Reef'), ('KI', 'Kiribati'), ('XK', 'Kosovo'), ('KW', 'Kuwait'), ('KG', 'Kyrgyzstan'), ('LA', 'Laos'), ('LV', 'Latvia'), ('LB', 'Lebanon'), ('LS', 'Lesotho'), ('LR', 'Liberia'), ('LY', 'Libya'), ('LI', 'Liechtenstein'), ('LT', 'Lithuania'), ('LU', 'Luxembourg'), ('MO', 'Macao'), ('MG', 'Madagascar'), ('MW', 'Malawi'), ('MY', 'Malaysia'), ('MV', 'Maldives'), ('ML', 'Mali'), ('MT', 'Malta'), ('MH', 'Marshall Islands'), ('MQ', 'Martinique'), ('MR', 'Mauritania'), ('MU', 'Mauritius'), ('YT', 'Mayotte'), ('ES-ML', 'Melilla'), ('MX', 'Mexico'), ('UM-71', 'Midway Islands'), ('MD', 'Moldova'), ('MC', 'Monaco'), ('MN', 'Mongolia'), ('ME', 'Montenegro'), ('MS', 'Montserrat'), ('MA', 'Morocco'), ('MZ', 'Mozambique'), ('MM', 'Myanmar (Burma)'), ('NA', 'Namibia'), ('NR', 'Nauru'), ('UM-76', 'Navassa Island'), ('NP', 'Nepal'), ('NL', 'Netherlands'), ('NC', 'New Caledonia'), ('NZ', 'New Zealand'), ('NI', 'Nicaragua'), ('NE', 'Niger'), ('NG', 'Nigeria'), ('NU', 'Niue'), ('NF', 'Norfolk Island'), ('MP', 'Northern Mariana Islands'), ('KP', 'North Korea'), ('MK', 'North Macedonia'), ('NO', 'Norway'), ('PS', 'Occupied Palestinian Territories'), ('OM', 'Oman'), ('PK', 'Pakistan'), ('PW', 'Palau'), ('UM-95', 'Palmyra Atoll'), ('PA', 'Panama'), ('PG', 'Papua New Guinea'), ('PY', 'Paraguay'), ('PE', 'Peru'), ('PH', 'Philippines'), ('PN', 'Pitcairn, Henderson, Ducie and Oeno Islands'), ('PL', 'Poland'), ('PT', 'Portugal'), ('PR', 'Puerto Rico'), ('QA', 'Qatar'), ('AE-RK', 'Ras al-Khaimah'), ('RE', 'Réunion'), ('RO', 'Romania'), ('RU', 'Russia'), ('RW', 'Rwanda'), ('BQ-SA', 'Saba'), ('BL', 'Saint Barthélemy'), ('SH-HL', 'Saint Helena'), ('MF', 'Saint-Martin (French part)'), ('PM', 'Saint Pierre and Miquelon'), ('WS', 'Samoa'), ('SM', 'San Marino'), ('ST', 'Sao Tome and Principe'), ('SA', 'Saudi Arabia'), ('SN', 'Senegal'), ('RS', 'Serbia'), ('SC', 'Seychelles'), ('AE-SH', 'Sharjah'), ('SL', 'Sierra Leone'), ('SG', 'Singapore'), ('BQ-SE', 'Sint Eustatius'), ('SX', 'Sint Maarten (Dutch part)'), ('SK', 'Slovakia'), ('SI', 'Slovenia'), ('SB', 'Solomon Islands'), ('SO', 'Somalia'), ('ZA', 'South Africa'), ('GS', 'South Georgia and South Sandwich Islands'), ('KR', 'South Korea'), ('SS', 'South Sudan'), ('ES', 'Spain'), ('LK', 'Sri Lanka'), ('KN', 'St Kitts and Nevis'), ('LC', 'St Lucia'), ('VC', 'St Vincent'), ('SD', 'Sudan'), ('SR', 'Suriname'), ('SJ', 'Svalbard and Jan Mayen'), ('SE', 'Sweden'), ('CH', 'Switzerland'), ('SY', 'Syria'), ('TW', 'Taiwan'), ('TJ', 'Tajikistan'), ('TZ', 'Tanzania'), ('TH', 'Thailand'), ('BS', 'The Bahamas'), ('GM', 'The Gambia'), ('TG', 'Togo'), ('TK', 'Tokelau'), ('TO', 'Tonga'), ('TT', 'Trinidad and Tobago'), ('SH-TA', 'Tristan da Cunha'), ('TN', 'Tunisia'), ('TR', 'Turkey'), ('TM', 'Turkmenistan'), ('TC', 'Turks and Caicos Islands'), ('TV', 'Tuvalu'), ('UG', 'Uganda'), ('UA', 'Ukraine'), ('AE-UQ', 'Umm al-Quwain'), ('AE', 'United Arab Emirates'), ('GB', 'United Kingdom'), ('US', 'United States'), ('VI', 'United States Virgin Islands'), ('UY', 'Uruguay'), ('UZ', 'Uzbekistan'), ('VU', 'Vanuatu'), ('VA', 'Vatican City'), ('VE', 'Venezuela'), ('VN', 'Vietnam'), ('UM-79', 'Wake Island'), ('WF', 'Wallis and Futuna'), ('EH', 'Western Sahara'), ('YE', 'Yemen'), ('ZM', 'Zambia'), ('ZW', 'Zimbabwe')], max_length=5, null=True, verbose_name='Global HQ country')),
                ('global_turnover_millions_usd', models.BigIntegerField(blank=True, null=True, verbose_name='Global turnover (millions USD)')),
                ('global_number_of_employees', models.BigIntegerField(blank=True, null=True, verbose_name='Global number of employees')),
                ('sectors', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(choices=[('SL0001', 'Advanced engineering'), ('SL0011', 'Aerospace'), ('SL0022', 'Agriculture, horticulture, fisheries and pets'), ('SL0049', 'Airports'), ('SL0050', 'Automotive'), ('SL0071', 'Chemicals'), ('SL0077', 'Construction'), ('SL0078', 'Consumer and retail'), ('SL0102', 'Creative industries'), ('SL0139', 'Defence'), ('SL0140', 'Education and training'), ('SL0169', 'Energy'), ('SL0187', 'Environment'), ('SL0194', 'Financial and professional services'), ('SL0221', 'Food and drink'), ('SL0236', 'Healthcare services'), ('SL0432', 'Logistics'), ('SL0245', 'Maritime'), ('SL0274', 'Medical devices and equipment'), ('SL0279', 'Mining'), ('SL0280', 'Pharmaceuticals and biotechnology'), ('SL0286', 'Railways'), ('SL0287', 'Security'), ('SL0289', 'Space'), ('SL0305', 'Sports economy'), ('SL0312', 'Technology and smart cities'), ('SL0337', 'Water')], max_length=6), blank=True, default=list, null=True, size=None, verbose_name='Sectors')),
            ],
            options={
                'verbose_name_plural': 'companies',
                'ordering': ['name', 'duns_number', 'id'],
            },
        ),
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.', max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name='username')),
                ('first_name', models.CharField(blank=True, max_length=150, verbose_name='first name')),
                ('last_name', models.CharField(blank=True, max_length=150, verbose_name='last name')),
                ('email', models.EmailField(blank=True, max_length=254, verbose_name='email address')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'ordering': ['last_name', 'first_name', 'email', 'id'],
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name='CompanyAccountManager',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('is_lead', models.BooleanField(default=False)),
                ('account_manager', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('company', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.company')),
            ],
            options={
                'verbose_name': 'account manager',
                'verbose_name_plural': 'account managers',
            },
        ),
        migrations.AddField(
            model_name='company',
            name='account_manager',
            field=models.ManyToManyField(related_name='managed_companies', through='core.CompanyAccountManager', to=settings.AUTH_USER_MODEL),
        ),
        migrations.CreateModel(
            name='Engagement',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=128)),
                ('date', models.DateField(null=True)),
                ('details', models.TextField(blank=True, max_length=500, null=True)),
                ('company', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='engagements', to='core.company')),
            ],
        ),
        migrations.CreateModel(
            name='EngagementNote',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('contents', models.TextField(blank=True, default='', max_length=500)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='created_by', to=settings.AUTH_USER_MODEL)),
                ('engagement', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notes', to='core.engagement')),
            ],
        ),
        migrations.CreateModel(
            name='Insight',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('insight_type', models.CharField(choices=[('company_priority', 'Company Priority'), ('hmg_priority', 'HMG Priority')], max_length=20)),
                ('title', models.CharField(max_length=255)),
                ('details', models.TextField(blank=True, max_length=500)),
                ('order', models.IntegerField(default=0)),
                ('company', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='insights', to='core.company')),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_insights', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['insight_type', 'order', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='KeyPeople',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=128)),
                ('role', models.CharField(max_length=128)),
                ('company', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='key_people', to='core.company')),
            ],
            options={
                'verbose_name_plural': 'Key people',
            },
        ),
        migrations.AddConstraint(
            model_name='companyaccountmanager',
            constraint=models.UniqueConstraint(fields=('company', 'account_manager'), name='company_account_manager'),
        ),
    ]
