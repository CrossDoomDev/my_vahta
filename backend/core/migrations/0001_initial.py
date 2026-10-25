# Initial PostgreSQL schema for the modular-monolith foundation.
import core.models
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models
from django.db.models import F, Q


class Migration(migrations.Migration):
    initial = True

    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]

    operations = [
        migrations.CreateModel(
            name="Organization",
            fields=[
                ("id", models.UUIDField(default=core.models.uid, editable=False, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=200)),
                ("region", models.CharField(blank=True, max_length=100)),
                ("description", models.TextField(blank=True)),
                ("published", models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name="Profile",
            fields=[
                ("id", models.UUIDField(default=core.models.uid, editable=False, primary_key=True, serialize=False)),
                ("display_name", models.CharField(max_length=80)),
                ("profession", models.CharField(blank=True, max_length=100)),
                ("discoverable", models.BooleanField(default=False)),
                ("sync_revision", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="vahta_profile", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="Privacy",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("self", "Только я"), ("friends", "Друзья"), ("all", "Все")], default="friends", max_length=7)),
                ("countdown", models.CharField(choices=[("self", "Только я"), ("friends", "Друзья"), ("all", "Все")], default="friends", max_length=7)),
                ("calendar", models.CharField(choices=[("self", "Только я"), ("friends", "Друзья"), ("all", "Все")], default="self", max_length=7)),
                ("organization", models.CharField(choices=[("self", "Только я"), ("friends", "Друзья"), ("all", "Все")], default="friends", max_length=7)),
                ("finance", models.CharField(choices=[("self", "Только я"), ("friends", "Друзья"), ("all", "Все")], default="self", max_length=7)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="vahta_privacy", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="Shift",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("start", models.DateField()),
                ("end", models.DateField()),
                ("vacation", models.BooleanField(default=False)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="vahta_shift", to=settings.AUTH_USER_MODEL)),
            ],
            options={"constraints": [models.CheckConstraint(condition=Q(end__gte=F("start")), name="shift_valid_dates")]},
        ),
        migrations.CreateModel(
            name="Payment",
            fields=[
                ("id", models.UUIDField(default=core.models.uid, editable=False, primary_key=True, serialize=False)),
                ("client_id", models.CharField(blank=True, max_length=100)),
                ("date", models.DateField()),
                ("type", models.CharField(choices=[("advance", "Аванс"), ("salary", "Зарплата"), ("bonus", "Премия"), ("other", "Другое")], max_length=7)),
                ("amount", models.PositiveBigIntegerField()),
                ("description", models.CharField(blank=True, max_length=300)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="vahta_payments", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-date", "-created_at"]},
        ),
        migrations.CreateModel(
            name="Note",
            fields=[
                ("id", models.UUIDField(default=core.models.uid, editable=False, primary_key=True, serialize=False)),
                ("client_id", models.CharField(blank=True, max_length=100)),
                ("title", models.CharField(max_length=100)),
                ("category", models.CharField(blank=True, max_length=50)),
                ("text", models.TextField(blank=True, max_length=5000)),
                ("tasks", models.JSONField(default=list)),
                ("updated", models.DateField(default=django.utils.timezone.localdate)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="vahta_notes", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-updated", "-id"]},
        ),
        migrations.CreateModel(
            name="FriendRequest",
            fields=[
                ("id", models.UUIDField(default=core.models.uid, editable=False, primary_key=True, serialize=False)),
                ("status", models.CharField(choices=[("pending", "Ожидает"), ("accepted", "Принята"), ("declined", "Отклонена"), ("cancelled", "Отменена")], default="pending", max_length=9)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("responded_at", models.DateTimeField(blank=True, null=True)),
                ("recipient", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="vahta_requests_received", to=settings.AUTH_USER_MODEL)),
                ("sender", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="vahta_requests_sent", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="Friendship",
            fields=[
                ("id", models.UUIDField(default=core.models.uid, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user_high", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="vahta_friends_high", to=settings.AUTH_USER_MODEL)),
                ("user_low", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="vahta_friends_low", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="Message",
            fields=[
                ("id", models.UUIDField(default=core.models.uid, editable=False, primary_key=True, serialize=False)),
                ("text", models.CharField(max_length=1000)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("recipient", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="vahta_received_messages", to=settings.AUTH_USER_MODEL)),
                ("sender", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="vahta_sent_messages", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="Notification",
            fields=[
                ("id", models.UUIDField(default=core.models.uid, editable=False, primary_key=True, serialize=False)),
                ("kind", models.CharField(max_length=32)),
                ("title", models.CharField(max_length=120)),
                ("body", models.CharField(blank=True, max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("read_at", models.DateTimeField(blank=True, null=True)),
                ("request", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="core.friendrequest")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="vahta_notifications", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="Review",
            fields=[
                ("id", models.UUIDField(default=core.models.uid, editable=False, primary_key=True, serialize=False)),
                ("scores", models.JSONField(default=dict)),
                ("comment", models.TextField(blank=True, max_length=3000)),
                ("visibility", models.CharField(choices=[("self", "Только я"), ("friends", "Друзья"), ("all", "Все")], default="self", max_length=7)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("author", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="vahta_reviews", to=settings.AUTH_USER_MODEL)),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="reviews", to="core.organization")),
            ],
        ),
        migrations.AddIndex("Payment", models.Index(fields=["user", "-date"], name="payment_owner_date_idx")),
        migrations.AddConstraint("Payment", models.UniqueConstraint(fields=["user", "client_id"], condition=~Q(client_id=""), name="payment_client_unique")),
        migrations.AddConstraint("Payment", models.CheckConstraint(condition=Q(amount__gt=0), name="payment_positive_amount")),
        migrations.AddConstraint("Note", models.UniqueConstraint(fields=["user", "client_id"], condition=~Q(client_id=""), name="note_client_unique")),
        migrations.AddIndex("FriendRequest", models.Index(fields=["recipient", "status"], name="request_incoming_idx")),
        migrations.AddConstraint("FriendRequest", models.CheckConstraint(condition=~Q(sender=F("recipient")), name="request_not_self")),
        migrations.AddConstraint("FriendRequest", models.UniqueConstraint(fields=["sender", "recipient"], condition=Q(status="pending"), name="request_one_pending_direction")),
        migrations.AddConstraint("Friendship", models.UniqueConstraint(fields=["user_low", "user_high"], name="friendship_pair_unique")),
        migrations.AddConstraint("Friendship", models.CheckConstraint(condition=Q(user_low__lt=F("user_high")), name="friendship_pair_sorted")),
        migrations.AddIndex("Message", models.Index(fields=["recipient", "-created_at"], name="message_inbox_idx")),
        migrations.AddConstraint("Review", models.UniqueConstraint(fields=["author", "organization"], name="review_one_per_employer")),
    ]
