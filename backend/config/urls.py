from django.contrib import admin
from django.urls import include, path, re_path

from core.frontend import frontend_index, frontend_asset
from core.api import health

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", health, name="api-health"),
    path("api/v1/", include("core.urls")),
    # Only these exact legacy JS/CSS/assets are public. NEVER expose repository root.
    re_path(
        r"^(?P<filename>(?:app|backend-client)\.js|(?:styles|friends|organizations)\.css|"
        r"data/(?:organizations|organizations-ui)\.js|assets/[A-Za-z0-9_./-]+\.svg)$",
        frontend_asset,
        name="frontend-asset",
    ),
    path("", frontend_index, name="home"),
]
