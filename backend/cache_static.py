"""
Custom StaticFiles handler that sets Cache-Control headers so browsers
pick up code changes without requiring a manual hard reload.

Strategy:
  - HTML files: Cache-Control: no-cache (browser MUST revalidate every request).
    Combined with Starlette's built-in ETag support, this means the browser
    sends If-None-Match and gets a quick 304 when nothing changed.
  - All other static assets (JS, CSS, images, etc.):
    Cache-Control: public, max-age=3600 (1 hour).
    Because the HTML is always fresh, any new JS/CSS references in <script>/<link>
    tags will be picked up within one hour at most.
"""

import os
from starlette.staticfiles import StaticFiles
from starlette.responses import Response


class CacheAwareStaticFiles(StaticFiles):
    """StaticFiles subclass that adds Cache-Control headers."""

    async def get_response(self, path: str, scope) -> Response:
        response = await super().get_response(path, scope)

        if path.endswith(".html") or path.endswith(".htm") or path == "" or path.endswith("/"):
            # HTML must always be revalidated so users get the latest JS/CSS links.
            response.headers["Cache-Control"] = "no-cache, must-revalidate"
        else:
            # JS, CSS, images, fonts etc. can be cached for a short period.
            response.headers["Cache-Control"] = "public, max-age=3600"

        return response
