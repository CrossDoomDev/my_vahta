"""Serve the unchanged legacy prototype from Django on localhost.

Only explicit asset paths from config.urls are allowed; never serve arbitrary
repository files (such as .env, requirements.txt, or private backups).
"""
import mimetypes
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponse
from django.views.decorators.http import require_GET


@require_GET
def frontend_index(request):
    data = (settings.PROJECT_ROOT / "index.html").read_bytes()
    response = HttpResponse(data, content_type="text/html; charset=utf-8")
    response["Cache-Control"] = "no-store"
    return response


@require_GET
def frontend_asset(request, filename):
    root = settings.PROJECT_ROOT.resolve()
    candidate = (root / filename).resolve()
    if not candidate.is_relative_to(root) or not candidate.is_file():
        raise Http404("Ресурс не найден")
    # URL regexp is already an allowlist; this check is defense in depth.
    suffix = candidate.suffix.lower()
    if suffix not in {".js", ".css", ".svg"}:
        raise Http404("Недопустимый тип ресурса")
    response = FileResponse(candidate.open("rb"), content_type=mimetypes.guess_type(candidate.name)[0] or "application/octet-stream")
    response["Cache-Control"] = "no-cache"
    response["X-Content-Type-Options"] = "nosniff"
    return response
