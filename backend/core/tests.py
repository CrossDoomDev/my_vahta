"""API contract, privacy and synchronization regression tests."""
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import FriendRequest, Friendship, Note, Payment, Privacy, Profile, Shift

User = get_user_model()


class APITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.alice = self.make_user("alice")
        self.bob = self.make_user("bobby")
        self.charlie = self.make_user("charlie")
        self.login(self.alice)

    def make_user(self, handle):
        user = User.objects.create_user(username=handle, password="Example-test-password-425!")
        Profile.objects.create(user=user, display_name=handle.title())
        Privacy.objects.create(user=user)
        Shift.objects.create(user=user, start=date(2026, 10, 1), end=date(2026, 10, 31))
        return user

    def login(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION="Token " + token.key)

    def test_frontend_and_api_routes(self):
        homepage = self.client.get("/")
        self.assertEqual(homepage.status_code, 200)
        self.assertIn(b"app.js", homepage.content)
        asset = self.client.get("/app.js")
        self.assertEqual(asset.status_code, 200)
        self.assertEqual(self.client.get("/.env").status_code, 404)
        self.assertEqual(self.client.get("/requirements.txt").status_code, 404)
        self.assertEqual(self.client.get("/api/v1/health/").status_code, 200)

    def test_anonymous_cannot_read_payments_or_shift(self):
        self.client.credentials()
        self.assertEqual(self.client.get("/api/v1/payments/").status_code, 401)
        self.assertEqual(self.client.get("/api/v1/shift/").status_code, 401)
        self.assertEqual(self.client.get("/api/v1/sync/").status_code, 401)

    def test_register_and_login(self):
        self.client.credentials()
        response = self.client.post("/api/v1/auth/register/", {
            "username": "someone", "password": "Secure-test-password-425!", "display_name": "Новый пользователь"
        }, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertIn("token", response.data)
        self.assertEqual(Profile.objects.get(user__username="someone").display_name, "Новый пользователь")
        self.assertEqual(Privacy.objects.get(user__username="someone").finance, "self")
        login = self.client.post("/api/v1/auth/login/", {
            "username": "someone", "password": "Secure-test-password-425!"
        }, format="json")
        self.assertEqual(login.status_code, 200, login.data)
        self.assertTrue(login.data["token"])

    def test_search_is_opt_in(self):
        resp = self.client.get("/api/v1/users/?q=bob")
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.data["results"])
        self.login(self.bob)
        saved = self.client.patch("/api/v1/me/", {"discoverable": True}, format="json")
        self.assertEqual(saved.status_code, 200)
        self.login(self.alice)
        found = self.client.get("/api/v1/users/?q=bob")
        self.assertEqual(found.status_code, 200)
        self.assertEqual(len(found.data["results"]), 1)
        self.assertNotIn("password", found.data["results"][0])

    def test_shift_extension_and_income_summary(self):
        for day, amount in (("2026-10-15", 40000), ("2026-11-12", 30000), ("2026-12-02", 10000)):
            resp = self.client.post("/api/v1/payments/", {
                "date": day, "type": "advance", "amount": amount
            }, format="json")
            self.assertEqual(resp.status_code, 201, resp.data)
        summary = self.client.get("/api/v1/shift/summary/")
        self.assertEqual(summary.data["received_amount"], 40000)
        changed = self.client.put("/api/v1/shift/", {
            "start": "2026-10-01", "end": "2026-11-30", "vacation": False
        }, format="json")
        self.assertEqual(changed.status_code, 200)
        summary = self.client.get("/api/v1/shift/summary/")
        self.assertEqual(summary.data["received_amount"], 70000)
        self.assertEqual(summary.data["payment_count"], 2)
        self.assertEqual(str(summary.data["end"]), "2026-11-30")

    def test_invalid_shift_range_is_rejected(self):
        resp = self.client.put("/api/v1/shift/", {
            "start": "2026-11-30", "end": "2026-10-01", "vacation": False
        }, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(Shift.objects.get(user=self.alice).end, date(2026, 10, 31))

    def test_private_payment_and_note_are_isolated(self):
        payment = self.client.post("/api/v1/payments/", {
            "date": "2026-10-04", "type": "salary", "amount": 15000
        }, format="json")
        note = self.client.post("/api/v1/notes/", {
            "title": "Заметка", "updated": "2026-10-04", "tasks": [{"text": "Документы", "done": False}]
        }, format="json")
        self.assertEqual(payment.status_code, 201)
        self.assertEqual(note.status_code, 201)
        self.login(self.bob)
        self.assertEqual(self.client.get("/api/v1/payments/").data["count"], 0)
        self.assertEqual(self.client.get("/api/v1/notes/").data["count"], 0)
        self.assertEqual(self.client.get("/api/v1/payments/" + str(payment.data["id"]) + "/").status_code, 404)
        self.assertEqual(self.client.get("/api/v1/notes/" + str(note.data["id"]) + "/").status_code, 404)

    def test_friend_request_acceptance_and_notifications(self):
        target = Profile.objects.get(user=self.bob)
        sent = self.client.post("/api/v1/friend-requests/", {"recipient_id": str(target.id)}, format="json")
        self.assertEqual(sent.status_code, 201, sent.data)
        request_id = sent.data["id"]
        duplicate = self.client.post("/api/v1/friend-requests/", {"recipient_id": str(target.id)}, format="json")
        self.assertEqual(duplicate.status_code, 409)
        self.login(self.charlie)
        self.assertEqual(self.client.post("/api/v1/friend-requests/" + str(request_id) + "/accept/").status_code, 404)
        self.login(self.bob)
        inbox = self.client.get("/api/v1/notifications/")
        self.assertEqual(inbox.data["count"], 1)
        accepted = self.client.post("/api/v1/friend-requests/" + str(request_id) + "/accept/")
        self.assertEqual(accepted.status_code, 200)
        self.assertTrue(Friendship.objects.exists())
        self.assertEqual(FriendRequest.objects.get(pk=request_id).status, "accepted")
        self.assertEqual(self.client.get("/api/v1/friends/").data["results"][0]["handle"], "alice")
        self.login(self.alice)
        self.assertTrue(self.client.get("/api/v1/notifications/").data["results"][0]["kind"] == "friend_accepted")

    def test_declined_and_cancelled_requests(self):
        target = Profile.objects.get(user=self.bob)
        request = self.client.post("/api/v1/friend-requests/", {"recipient_id": str(target.id)}, format="json")
        self.login(self.bob)
        self.assertEqual(self.client.post(f"/api/v1/friend-requests/{request.data['id']}/decline/").status_code, 200)
        self.assertFalse(Friendship.objects.exists())
        self.login(self.alice)
        request = self.client.post("/api/v1/friend-requests/", {"recipient_id": str(target.id)}, format="json")
        self.assertEqual(request.status_code, 201)
        self.assertEqual(self.client.post(f"/api/v1/friend-requests/{request.data['id']}/cancel/").status_code, 200)
        self.assertFalse(Friendship.objects.exists())

    def test_messages_only_between_friends(self):
        peer = Profile.objects.get(user=self.bob)
        unauthorized = self.client.post("/api/v1/messages/", {
            "recipient_id": str(peer.id), "text": "Здравствуйте"
        }, format="json")
        self.assertEqual(unauthorized.status_code, 403)
        low, high = sorted((self.alice.pk, self.bob.pk))
        Friendship.objects.create(user_low_id=low, user_high_id=high)
        message = self.client.post("/api/v1/messages/", {
            "recipient_id": str(peer.id), "text": "Привет"
        }, format="json")
        self.assertEqual(message.status_code, 201, message.data)
        self.login(self.bob)
        received = self.client.get("/api/v1/messages/?peer=" + str(Profile.objects.get(user=self.alice).id))
        self.assertEqual(len(received.data["results"]), 1)
        self.login(self.charlie)
        self.assertEqual(self.client.get("/api/v1/messages/?peer=" + str(peer.id)).status_code, 403)

    def test_import_and_revision_conflict(self):
        data = {
            "revision": 0,
            "shift": {"start": "2026-10-01", "end": "2026-12-31", "vacation": False},
            "payments": [
                {"client_id": "old-web-id", "date": "2026-11-01", "type": "bonus", "amount": 5000, "description": ""}
            ],
            "notes": [
                {"client_id": "note-web-id", "title": "Важно", "category": "Работа", "text": "Проверить", "tasks": [], "updated": "2026-11-02"}
            ],
        }
        first = self.client.put("/api/v1/sync/", data, format="json")
        self.assertEqual(first.status_code, 200, first.data)
        self.assertEqual(first.data["revision"], 1)
        repeated = self.client.put("/api/v1/sync/", data, format="json")
        self.assertEqual(repeated.status_code, 409)
        pulled = self.client.get("/api/v1/sync/")
        self.assertEqual(pulled.data["revision"], 1)
        self.assertEqual(pulled.data["payments"][0]["client_id"], "old-web-id")
        self.assertEqual(pulled.data["notes"][0]["client_id"], "note-web-id")
        self.login(self.bob)
        self.assertEqual(self.client.get("/api/v1/sync/").data["payments"], [])

    def test_weak_password_rejected_cleanly(self):
        self.client.credentials()
        res = self.client.post("/api/v1/auth/register/", {
            "username": "weakworker", "password": "1234", "display_name": "User"
        }, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("password", res.data)

    def test_invalid_account_id_is_a_client_error(self):
        res = self.client.post("/api/v1/friend-requests/", {"recipient_id": "fake-user"}, format="json")
        self.assertEqual(res.status_code, 400)
        res = self.client.post("/api/v1/messages/", {"recipient_id": "fake-user", "text": "Hello"}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_malformed_sync_does_not_erase_previous_records(self):
        Payment.objects.create(user=self.alice, date=date(2026, 10, 15), type="salary", amount=12345)
        bad = {"revision": 0, "shift": {"start": "2026-10-01", "end": "2026-10-31", "vacation": False},
               "payments": [{"client_id": "same", "date": "2026-10-10", "type": "other", "amount": 1},
                            {"client_id": "same", "date": "2026-10-11", "type": "other", "amount": 1}],
               "notes": []}
        response = self.client.put("/api/v1/sync/", bad, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Payment.objects.filter(user=self.alice).count(), 1)

    def test_notification_preferences_are_scoped_and_validated(self):
        route = "/api/v1/me/notification-preferences/"
        defaults = self.client.get(route)
        self.assertEqual(defaults.status_code, 200)
        self.assertTrue(defaults.data["message"])
        self.assertEqual(defaults.data["shift_days"], 3)

        change = self.client.patch(route, {"message": False, "shift_days": 7}, format="json")
        self.assertEqual(change.status_code, 200, change.data)
        self.assertFalse(change.data["message"])
        self.assertEqual(change.data["shift_days"], 7)
        for invalid in ({"message": "false"}, {"shift_days": -1},
                        {"holiday_days": True}, {"secret": True}):
            self.assertEqual(self.client.patch(route, invalid, format="json").status_code, 400)
        self.assertFalse(self.client.get(route).data["message"])
        self.login(self.bob)
        self.assertTrue(self.client.get(route).data["message"])
        self.client.credentials()
        self.assertEqual(self.client.get(route).status_code, 401)

    def test_muted_categories_do_not_block_friend_requests_and_messages(self):
        bob = Profile.objects.get(user=self.bob)
        self.login(self.bob)
        changed = self.client.patch("/api/v1/me/notification-preferences/", {
            "friend_request": False, "message": False
        }, format="json")
        self.assertEqual(changed.status_code, 200)
        self.login(self.alice)
        sent = self.client.post("/api/v1/friend-requests/", {"recipient_id": str(bob.id)}, format="json")
        self.assertEqual(sent.status_code, 201)
        self.login(self.bob)
        self.assertEqual(self.client.get("/api/v1/notifications/unread-count/").data["count"], 0)
        self.assertEqual(len(self.client.get("/api/v1/friend-requests/").data["results"]), 1)
        self.assertEqual(self.client.post("/api/v1/friend-requests/" + str(sent.data["id"]) + "/accept/").status_code, 200)
        self.login(self.alice)
        self.assertEqual(self.client.post("/api/v1/messages/", {
            "recipient_id": str(bob.id), "text": "Привет"
        }, format="json").status_code, 201)
        self.login(self.bob)
        self.assertEqual(self.client.get("/api/v1/notifications/unread-count/").data["count"], 0)
        self.assertEqual(self.client.get("/api/v1/notifications/").data["count"], 0)
        self.assertEqual(len(self.client.get("/api/v1/messages/?peer=" +
                             str(Profile.objects.get(user=self.alice).id)).data["results"]), 1)

    def test_notifications_master_switch_and_payment_category(self):
        route = "/api/v1/me/notification-preferences/"
        self.assertEqual(self.client.patch(route, {"payments": False}, format="json").status_code, 200)
        self.assertEqual(self.client.post("/api/v1/payments/", {
            "date": "2026-10-03", "type": "salary", "amount": 12500
        }, format="json").status_code, 201)
        self.assertEqual(self.client.get("/api/v1/notifications/unread-count/").data["count"], 0)
        self.assertEqual(self.client.patch(route, {"payments": True}, format="json").status_code, 200)
        self.assertEqual(self.client.post("/api/v1/payments/", {
            "date": "2026-10-04", "type": "advance", "amount": 3000
        }, format="json").status_code, 201)
        self.assertEqual(self.client.get("/api/v1/notifications/unread-count/").data["count"], 1)
        self.assertEqual(self.client.patch(route, {"enabled": False}, format="json").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/notifications/unread-count/").data["count"], 0)
        self.assertEqual(self.client.get("/api/v1/notifications/").data["count"], 0)
        self.assertEqual(self.client.patch(route, {"enabled": True}, format="json").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/notifications/unread-count/").data["count"], 1)
