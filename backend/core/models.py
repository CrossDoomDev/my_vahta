"""Server-owned domain state; browser demo identities are never authoritative."""
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q
from django.utils import timezone


def uid():
    return uuid.uuid4()


class Profile(models.Model):
    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vahta_profile")
    display_name = models.CharField(max_length=80)
    profession = models.CharField(max_length=100, blank=True)
    discoverable = models.BooleanField(default=False)
    sync_revision = models.PositiveIntegerField(default=0)
    notification_preferences = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.display_name or self.user.username


class Privacy(models.Model):
    class Audience(models.TextChoices):
        SELF = "self", "Только я"
        FRIENDS = "friends", "Друзья"
        ALL = "all", "Все"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vahta_privacy")
    status = models.CharField(max_length=7, choices=Audience.choices, default=Audience.FRIENDS)
    countdown = models.CharField(max_length=7, choices=Audience.choices, default=Audience.FRIENDS)
    calendar = models.CharField(max_length=7, choices=Audience.choices, default=Audience.SELF)
    organization = models.CharField(max_length=7, choices=Audience.choices, default=Audience.FRIENDS)
    finance = models.CharField(max_length=7, choices=Audience.choices, default=Audience.SELF)


class Shift(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vahta_shift")
    start = models.DateField()
    end = models.DateField()
    vacation = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.CheckConstraint(condition=Q(end__gte=F("start")), name="shift_valid_dates")]

    def clean(self):
        if self.start and self.end and self.end < self.start:
            raise ValidationError({"end": "Дата окончания не может быть раньше начала."})


class Payment(models.Model):
    class Kind(models.TextChoices):
        ADVANCE = "advance", "Аванс"
        SALARY = "salary", "Зарплата"
        BONUS = "bonus", "Премия"
        OTHER = "other", "Другое"

    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vahta_payments")
    client_id = models.CharField(max_length=100, blank=True)
    date = models.DateField()
    type = models.CharField(max_length=7, choices=Kind.choices)
    amount = models.PositiveBigIntegerField()
    description = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["user", "-date"], name="payment_owner_date_idx")]
        constraints = [
            models.UniqueConstraint(fields=["user", "client_id"], condition=~Q(client_id=""), name="payment_client_unique"),
            models.CheckConstraint(condition=Q(amount__gt=0), name="payment_positive_amount"),
        ]
        ordering = ["-date", "-created_at"]


class Note(models.Model):
    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vahta_notes")
    client_id = models.CharField(max_length=100, blank=True)
    title = models.CharField(max_length=100)
    category = models.CharField(max_length=50, blank=True)
    text = models.TextField(max_length=5000, blank=True)
    tasks = models.JSONField(default=list)
    updated = models.DateField(default=timezone.localdate)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "client_id"], condition=~Q(client_id=""), name="note_client_unique")]
        ordering = ["-updated", "-id"]


class FriendRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Ожидает"
        ACCEPTED = "accepted", "Принята"
        DECLINED = "declined", "Отклонена"
        CANCELLED = "cancelled", "Отменена"

    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vahta_requests_sent")
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vahta_requests_received")
    status = models.CharField(max_length=9, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["recipient", "status"], name="request_incoming_idx")]
        constraints = [
            models.CheckConstraint(condition=~Q(sender=F("recipient")), name="request_not_self"),
            models.UniqueConstraint(fields=["sender", "recipient"], condition=Q(status="pending"), name="request_one_pending_direction"),
        ]


class Friendship(models.Model):
    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    user_low = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vahta_friends_low")
    user_high = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vahta_friends_high")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user_low", "user_high"], name="friendship_pair_unique"),
            models.CheckConstraint(condition=Q(user_low__lt=F("user_high")), name="friendship_pair_sorted"),
        ]


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vahta_notifications")
    kind = models.CharField(max_length=32)
    title = models.CharField(max_length=120)
    body = models.CharField(max_length=500, blank=True)
    request = models.ForeignKey(FriendRequest, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vahta_sent_messages")
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vahta_received_messages")
    text = models.CharField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["recipient", "-created_at"], name="message_inbox_idx")]
        ordering = ["-created_at"]


class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    name = models.CharField(max_length=200)
    region = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    published = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vahta_reviews")
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="reviews")
    scores = models.JSONField(default=dict)
    comment = models.TextField(max_length=3000, blank=True)
    visibility = models.CharField(max_length=7, choices=Privacy.Audience.choices, default=Privacy.Audience.SELF)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["author", "organization"], name="review_one_per_employer")]
