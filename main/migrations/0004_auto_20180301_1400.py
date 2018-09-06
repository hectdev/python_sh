# Generated by Django 2.0.1 on 2018-03-01 14:00

from django.db import migrations
import uuid


def gen_uuid(apps, schema_editor):
    MyModel = apps.get_model('main', 'User')
    for row in MyModel.objects.all():
        row.support_staff = uuid.uuid4()
        row.save(update_fields=['support_staff'])

class Migration(migrations.Migration):

    dependencies = [
        ('main', '0003_auto_20180301_1358'),
    ]

    operations = [
        migrations.RunPython(gen_uuid, reverse_code=migrations.RunPython.noop),
    ]