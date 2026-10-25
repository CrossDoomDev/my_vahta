from django.contrib import admin
from .models import FriendRequest, Friendship, Message, Note, Notification, Organization, Payment, Privacy, Profile, Review, Shift

admin.site.register([Profile, Privacy, Shift, Payment, Note, FriendRequest, Friendship, Notification, Message, Organization, Review])
admin.site.site_header = "Моя вахта — управление"
