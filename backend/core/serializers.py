from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import FriendRequest, Note, Notification, Payment, Privacy, Profile, Shift, Message

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=3, max_length=40)
    password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=128)
    display_name = serializers.CharField(max_length=80)

    def validate_username(self, value):
        if not all(ch.isascii() and (ch.isalnum() or ch in "_-") for ch in value):
            raise serializers.ValidationError("ID: только латинские буквы, цифры, '_' и '-'.")
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Такое имя пользователя уже занято.")
        return value

    def validate(self, attrs):
        try:
            validate_password(attrs["password"], user=User(username=attrs["username"]))
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": exc.messages})
        return attrs

    def create(self, validated_data):
        from django.db import transaction
        from django.utils import timezone

        with transaction.atomic():
            user = User.objects.create_user(username=validated_data["username"], password=validated_data["password"])
            Profile.objects.create(user=user, display_name=validated_data["display_name"])
            Privacy.objects.create(user=user)
            today = timezone.localdate()
            Shift.objects.create(user=user, start=today, end=today)
        return user


class AccountSerializer(serializers.ModelSerializer):
    handle = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Profile
        fields = ("id", "handle", "display_name", "profession", "discoverable")
        read_only_fields = ("id", "handle")


class PrivacySerializer(serializers.ModelSerializer):
    class Meta:
        model = Privacy
        fields = ("status", "countdown", "calendar", "organization", "finance")


class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = ("start", "end", "vacation")

    def validate(self, attrs):
        start = attrs.get("start", getattr(self.instance, "start", None))
        end = attrs.get("end", getattr(self.instance, "end", None))
        if start and end and start > end:
            raise serializers.ValidationError({"end": "Конец вахты раньше начала."})
        return attrs


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ("id", "client_id", "date", "type", "amount", "description")
        read_only_fields = ("id",)

    def validate_amount(self, value):
        if not (0 < value <= 1_000_000_000):
            raise serializers.ValidationError("Сумма вне допустимого диапазона.")
        return value

    def validate_client_id(self, value):
        if any(ord(c) < 32 for c in value):
            raise serializers.ValidationError("Недопустимый идентификатор.")
        return value


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ("id", "client_id", "title", "category", "text", "tasks", "updated")
        read_only_fields = ("id",)

    def validate_tasks(self, value):
        if not isinstance(value, list) or len(value) > 70:
            raise serializers.ValidationError("Допускается не более 70 пунктов.")
        for row in value:
            if not isinstance(row, dict) or not isinstance(row.get("text"), str) or len(row["text"]) > 200 or not isinstance(row.get("done", False), bool):
                raise serializers.ValidationError("Неверный формат пункта списка.")
        return [{"text": row["text"], "done": row.get("done", False)} for row in value]


class RequestSerializer(serializers.ModelSerializer):
    sender = serializers.UUIDField(source="sender.vahta_profile.id", read_only=True)
    recipient = serializers.UUIDField(source="recipient.vahta_profile.id", read_only=True)
    sender_name = serializers.CharField(source="sender.vahta_profile.display_name", read_only=True)
    recipient_name = serializers.CharField(source="recipient.vahta_profile.display_name", read_only=True)

    class Meta:
        model = FriendRequest
        fields = ("id", "sender", "recipient", "sender_name", "recipient_name", "status", "created_at", "responded_at")


class NotificationSerializer(serializers.ModelSerializer):
    request_id = serializers.UUIDField(source="request.id", read_only=True, allow_null=True)

    class Meta:
        model = Notification
        fields = ("id", "kind", "title", "body", "request_id", "created_at", "read_at")


class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.UUIDField(source="sender.vahta_profile.id", read_only=True)
    recipient_id = serializers.UUIDField(source="recipient.vahta_profile.id", read_only=True)

    class Meta:
        model = Message
        fields = ("id", "sender_id", "recipient_id", "text", "created_at")
