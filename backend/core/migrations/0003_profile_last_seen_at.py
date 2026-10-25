from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0002_profile_notification_preferences")]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="last_seen_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
