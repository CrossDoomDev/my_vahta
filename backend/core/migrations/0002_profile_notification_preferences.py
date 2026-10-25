from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="notification_preferences",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
