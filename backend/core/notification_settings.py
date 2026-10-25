"""Safe per-account notification preferences, shared by API and notification producers."""

DEFAULTS = {
    "enabled": True,
    "shift": True,
    "payments": True,
    "holidays": True,
    "friend_request": True,
    "friend_accepted": True,
    "message": True,
    "shift_days": 3,
    "holiday_days": 1,
}
REMINDER_DAYS = {"shift_days": (0, 1, 3, 7, 14), "holiday_days": (0, 1, 3, 7)}
CATEGORIES = ("shift", "payments", "holidays", "friend_request", "friend_accepted", "message")


def normalize_preferences(raw):
    raw = raw if isinstance(raw, dict) else {}
    prefs = DEFAULTS.copy()
    for key, value in raw.items():
        if key not in prefs:
            continue
        if key in REMINDER_DAYS:
            if type(value) is int and value in REMINDER_DAYS[key]:
                prefs[key] = value
        elif type(value) is bool:
            prefs[key] = value
    return prefs


def notifications_allowed(user, kind):
    from .models import Profile
    raw = Profile.objects.filter(user=user).values_list("notification_preferences", flat=True).first()
    prefs = normalize_preferences(raw)
    return bool(prefs["enabled"] and prefs.get(kind, False))
