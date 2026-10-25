from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import api

router = DefaultRouter()
router.register("payments", api.PaymentViewSet, basename="payment")
router.register("notes", api.NoteViewSet, basename="note")
router.register("friend-requests", api.FriendRequestViewSet, basename="friend-request")
router.register("notifications", api.NotificationViewSet, basename="notification")

urlpatterns = [
    path("auth/register/", api.RegisterView.as_view(), name="register"),
    path("auth/login/", api.LoginView.as_view(), name="login"),
    path("auth/logout/", api.LogoutView.as_view(), name="logout"),
    path("me/", api.MeView.as_view(), name="me"),
    path("me/privacy/", api.PrivacyView.as_view(), name="privacy"),
    path("shift/", api.ShiftView.as_view(), name="shift"),
    path("shift/summary/", api.ShiftSummaryView.as_view(), name="shift-summary"),
    path("sync/", api.SyncView.as_view(), name="sync"),
    path("users/", api.UserSearchView.as_view(), name="user-search"),
    path("friends/", api.FriendsView.as_view(), name="friends"),
    path("friends/<uuid:account_id>/", api.FriendRemoveView.as_view(), name="friend-remove"),
    path("messages/", api.MessagesView.as_view(), name="messages"),
    path("", include(router.urls)),
]
