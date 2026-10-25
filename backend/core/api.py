"""Authenticated, ownership-checked API. No demo friendship is trusted by server."""
from django.contrib.auth import authenticate, get_user_model
from uuid import UUID
from django.db import IntegrityError, transaction, connection
from django.db.models import F, Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView

from .models import FriendRequest, Friendship, Message, Note, Notification, Payment, Privacy, Profile, Shift
from .serializers import (
    AccountSerializer, MessageSerializer, NoteSerializer, NotificationSerializer,
    PaymentSerializer, PrivacySerializer, RegisterSerializer, RequestSerializer, ShiftSerializer,
)

User = get_user_model()


class LoginThrottle(AnonRateThrottle):
    rate = "6/min"


class RegisterThrottle(AnonRateThrottle):
    rate = "3/hour"


class SocialThrottle(UserRateThrottle):
    rate = "12/hour"


class SocialSearchThrottle(UserRateThrottle):
    rate = "60/min"


def resolve_account(value):
    try:
        account_id = UUID(str(value))
    except (ValueError, TypeError, AttributeError):
        raise ValidationError({"account_id": "Неверный формат ID аккаунта."})
    return get_object_or_404(Profile, id=account_id).user


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception:
        return Response({"status": "database_unavailable"}, status=503)
    return Response({"status": "ok", "service": "my_vahta", "api": "v1"})


def get_profile(user):
    profile, _ = Profile.objects.get_or_create(user=user, defaults={"display_name": user.username})
    return profile


def get_shift(user):
    day = timezone.localdate()
    shift, _ = Shift.objects.get_or_create(user=user, defaults={"start": day, "end": day})
    return shift


def bump(user):
    Profile.objects.filter(user=user).update(sync_revision=F("sync_revision") + 1)


def account_card(user):
    return AccountSerializer(get_profile(user)).data


def is_friend(a, b):
    if a.pk == b.pk:
        return False
    low, high = sorted((a.pk, b.pk))
    return Friendship.objects.filter(user_low_id=low, user_high_id=high).exists()


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [RegisterThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = serializer.save()
        except IntegrityError:
            raise ValidationError({"username": "ID уже занят."})
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "account": account_card(user)}, status=201)


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [LoginThrottle]

    def post(self, request):
        username, password = request.data.get("username", ""), request.data.get("password", "")
        if not isinstance(username, str) or not isinstance(password, str):
            raise ValidationError({"detail": "Неверный формат данных."})
        user = authenticate(request, username=username, password=password)
        if user is None or not user.is_active:
            return Response({"detail": "Неверный ID или пароль."}, status=400)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "account": account_card(user)})


class LogoutView(APIView):
    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=204)


class MeView(APIView):
    def get(self, request):
        return Response(AccountSerializer(get_profile(request.user)).data)

    def patch(self, request):
        serializer = AccountSerializer(get_profile(request.user), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PrivacyView(APIView):
    def get_object(self, user):
        obj, _ = Privacy.objects.get_or_create(user=user)
        return obj

    def get(self, request):
        return Response(PrivacySerializer(self.get_object(request.user)).data)

    def patch(self, request):
        serializer = PrivacySerializer(self.get_object(request.user), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ShiftView(APIView):
    def get(self, request):
        return Response(ShiftSerializer(get_shift(request.user)).data)

    @transaction.atomic
    def put(self, request):
        shift = get_shift(request.user)
        serializer = ShiftSerializer(shift, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        bump(request.user)
        return Response(serializer.data)


class ShiftSummaryView(APIView):
    def get(self, request):
        shift = get_shift(request.user)
        query = Payment.objects.filter(user=request.user, date__gte=shift.start, date__lte=shift.end)
        totals = query.aggregate(amount=Sum("amount"))
        return Response({
            "start": shift.start,
            "end": shift.end,
            "payment_count": query.count(),
            "received_amount": totals["amount"] or 0,
            "basis": "recorded_payments",
        })


class OwnedViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    owner_field = "user"

    def get_queryset(self):
        return self.queryset.filter(**{self.owner_field: self.request.user})

    @transaction.atomic
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        bump(self.request.user)

    @transaction.atomic
    def perform_update(self, serializer):
        serializer.save()
        bump(self.request.user)

    @transaction.atomic
    def perform_destroy(self, instance):
        instance.delete()
        bump(self.request.user)


class PaymentViewSet(OwnedViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer


class NoteViewSet(OwnedViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer


class UserSearchView(APIView):
    throttle_classes = [SocialSearchThrottle]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        if not (3 <= len(q) <= 60):
            return Response({"results": []})
        profiles = Profile.objects.select_related("user").filter(discoverable=True).exclude(user=request.user).filter(
            Q(display_name__icontains=q) | Q(user__username__icontains=q)
        ).order_by("display_name")[:20]
        return Response({"results": AccountSerializer(profiles, many=True).data})


class FriendsView(APIView):
    def get(self, request):
        links = Friendship.objects.filter(Q(user_low=request.user) | Q(user_high=request.user)).select_related("user_low", "user_high")
        people = [item.user_high if item.user_low_id == request.user.id else item.user_low for item in links]
        return Response({"results": [account_card(person) for person in people]})


class FriendRemoveView(APIView):
    @transaction.atomic
    def delete(self, request, account_id):
        other = get_object_or_404(Profile, id=account_id).user
        low, high = sorted((request.user.pk, other.pk))
        Friendship.objects.filter(user_low_id=low, user_high_id=high).delete()
        return Response(status=204)


class FriendRequestViewSet(viewsets.GenericViewSet):
    serializer_class = RequestSerializer

    def get_throttles(self):
        # Rate-limit new requests, not checking or accepting incoming invitations.
        if getattr(self, "action", None) == "create":
            return [SocialThrottle()]
        return super().get_throttles()

    def get_queryset(self):
        return FriendRequest.objects.select_related(
            "sender", "recipient", "sender__vahta_profile", "recipient__vahta_profile"
        ).filter(Q(sender=self.request.user) | Q(recipient=self.request.user)).order_by("-created_at")

    def list(self, request):
        return Response({"results": self.serializer_class(self.get_queryset()[:100], many=True).data})

    @transaction.atomic
    def create(self, request):
        incoming_id = request.data.get("recipient_id")
        if not incoming_id:
            raise ValidationError({"recipient_id": "Укажите ID аккаунта."})
        recipient = resolve_account(incoming_id)
        sender = request.user
        if sender.pk == recipient.pk:
            raise ValidationError({"detail": "Нельзя добавить самого себя."})
        low, high = sorted((sender.pk, recipient.pk))
        # Serialize reverse requests and accept races under PostgreSQL.
        list(User.objects.select_for_update().filter(pk__in=[low, high]).order_by("pk"))
        if Friendship.objects.filter(user_low_id=low, user_high_id=high).exists():
            return Response({"detail": "Вы уже друзья."}, status=409)
        if FriendRequest.objects.filter(status="pending").filter(
            Q(sender=sender, recipient=recipient) | Q(sender=recipient, recipient=sender)
        ).exists():
            return Response({"detail": "Заявка уже ожидает ответа."}, status=409)
        item = FriendRequest.objects.create(sender=sender, recipient=recipient)
        Notification.objects.create(
            user=recipient, kind="friend_request", title="Новая заявка в друзья",
            body=get_profile(sender).display_name + " хочет добавить вас в друзья.", request=item,
        )
        return Response(self.serializer_class(item).data, status=201)

    @transaction.atomic
    def respond(self, request, pk, decision):
        item = self.get_object()
        item = FriendRequest.objects.select_for_update().get(pk=item.pk)
        if item.status != "pending":
            return Response({"detail": "Заявка уже обработана."}, status=409)
        if decision in {"accepted", "declined"} and item.recipient_id != request.user.pk:
            return Response({"detail": "Ответить может только получатель."}, status=403)
        if decision == "cancelled" and item.sender_id != request.user.pk:
            return Response({"detail": "Отменить может только отправитель."}, status=403)
        item.status = decision
        item.responded_at = timezone.now()
        item.save(update_fields=["status", "responded_at"])
        Notification.objects.filter(user=item.recipient, request=item, kind="friend_request").update(read_at=timezone.now())
        if decision == "accepted":
            low, high = sorted((item.sender_id, item.recipient_id))
            Friendship.objects.get_or_create(user_low_id=low, user_high_id=high)
            Notification.objects.create(
                user=item.sender, kind="friend_accepted", title="Заявка принята",
                body=get_profile(item.recipient).display_name + " теперь в ваших друзьях.", request=item,
            )
        return Response(self.serializer_class(item).data)

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        return self.respond(request, pk, "accepted")

    @action(detail=True, methods=["post"])
    def decline(self, request, pk=None):
        return self.respond(request, pk, "declined")

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        return self.respond(request, pk, "cancelled")


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.read_at = timezone.now()
        notification.save(update_fields=["read_at"])
        return Response(self.serializer_class(notification).data)

    @action(detail=False, methods=["post"], url_path="read-all")
    def read_all(self, request):
        self.get_queryset().filter(read_at__isnull=True).update(read_at=timezone.now())
        return Response({"ok": True})

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        return Response({"count": self.get_queryset().filter(read_at__isnull=True).count()})


class MessagesView(APIView):
    def get(self, request):
        peer_id = request.query_params.get("peer")
        if not peer_id:
            return Response({"results": []})
        peer = resolve_account(peer_id)
        if not is_friend(request.user, peer):
            return Response({"detail": "Диалог доступен только друзьям."}, status=403)
        items = Message.objects.filter(
            Q(sender=request.user, recipient=peer) | Q(sender=peer, recipient=request.user)
        ).select_related("sender__vahta_profile", "recipient__vahta_profile").order_by("-created_at")[:100]
        return Response({"results": MessageSerializer(items, many=True).data})

    @transaction.atomic
    def post(self, request):
        recipient = resolve_account(request.data.get("recipient_id"))
        if not is_friend(request.user, recipient):
            return Response({"detail": "Сообщения доступны только друзьям."}, status=403)
        text = request.data.get("text")
        if not isinstance(text, str) or not (1 <= len(text.strip()) <= 1000):
            raise ValidationError({"text": "Введите сообщение длиной до 1000 символов."})
        message = Message.objects.create(sender=request.user, recipient=recipient, text=text.strip())
        Notification.objects.create(user=recipient, kind="message", title="Новое сообщение", body="Вам пришло сообщение.")
        return Response(MessageSerializer(message).data, status=201)


class SyncPaymentSerializer(serializers.Serializer):
    client_id = serializers.CharField(max_length=100, min_length=1)
    date = serializers.DateField()
    type = serializers.ChoiceField(choices=Payment.Kind.choices)
    amount = serializers.IntegerField(min_value=1, max_value=1_000_000_000)
    description = serializers.CharField(max_length=300, allow_blank=True, required=False, default="")


class SyncNoteSerializer(serializers.Serializer):
    client_id = serializers.CharField(max_length=100, min_length=1)
    title = serializers.CharField(max_length=100)
    category = serializers.CharField(max_length=50, allow_blank=True, required=False, default="")
    text = serializers.CharField(max_length=5000, allow_blank=True, required=False, default="")
    tasks = serializers.JSONField()
    updated = serializers.DateField()

    def validate_tasks(self, value):
        return NoteSerializer().validate_tasks(value)


class SyncUploadSerializer(serializers.Serializer):
    revision = serializers.IntegerField(min_value=0)
    shift = ShiftSerializer()
    payments = SyncPaymentSerializer(many=True)
    notes = SyncNoteSerializer(many=True)

    def validate(self, attrs):
        if len(attrs["payments"]) > 1000 or len(attrs["notes"]) > 500:
            raise ValidationError("Слишком большой пакет данных.")
        for name in ("payments", "notes"):
            ids = [row["client_id"] for row in attrs[name]]
            if len(ids) != len(set(ids)):
                raise ValidationError({name: "Повторяются идентификаторы записей."})
        return attrs


class SyncView(APIView):
    """Manual, explicit import/export during transition. Revision prevents silent overwrites."""

    def get(self, request):
        profile = get_profile(request.user)
        return Response({
            "revision": profile.sync_revision,
            "shift": ShiftSerializer(get_shift(request.user)).data,
            "payments": PaymentSerializer(Payment.objects.filter(user=request.user), many=True).data,
            "notes": NoteSerializer(Note.objects.filter(user=request.user), many=True).data,
        })

    @transaction.atomic
    def put(self, request):
        body = SyncUploadSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        profile = Profile.objects.select_for_update().get(user=request.user)
        if body.validated_data["revision"] != profile.sync_revision:
            return Response({"detail": "Данные изменились на сервере. Сначала загрузите новую версию.", "revision": profile.sync_revision}, status=409)
        payload = body.validated_data
        shift = get_shift(request.user)
        shift.start = payload["shift"]["start"]
        shift.end = payload["shift"]["end"]
        shift.vacation = payload["shift"]["vacation"]
        shift.full_clean()
        shift.save()
        Payment.objects.filter(user=request.user).delete()
        Note.objects.filter(user=request.user).delete()
        Payment.objects.bulk_create([
            Payment(user=request.user, **row) for row in payload["payments"]
        ])
        Note.objects.bulk_create([
            Note(user=request.user, **row) for row in payload["notes"]
        ])
        profile.sync_revision += 1
        profile.save(update_fields=["sync_revision"])
        return Response({"ok": True, "revision": profile.sync_revision})
