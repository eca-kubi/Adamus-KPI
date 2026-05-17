import os
import psutil
import tracemalloc
import logging
import asyncio
from datetime import datetime
from fastapi import Request
from pyinstrument import Profiler
from starlette.responses import HTMLResponse

logger = logging.getLogger(__name__)

# --- Performance Profiling ---

class ProfilingMiddleware:
    def __init__(self, app):
        self.app = app
        self.enabled = os.getenv("ENABLE_PROFILING", "false").lower() == "true"

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or not self.enabled:
            return await self.app(scope, receive, send)

        request = Request(scope, receive)
        # Check for profile query param: ?profile=true
        if request.query_params.get("profile") != "true":
            return await self.app(scope, receive, send)

        profiler = Profiler(interval=0.001)
        profiler.start()

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                # We can inject headers here if needed
                pass
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            profiler.stop()
            # If it's a profile request, we might want to return the HTML instead
            # but that's tricky with the way FastAPI handles responses.
            # For now, we'll log that a profile was taken and save it to a file.
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            path = request.url.path.replace("/", "_")
            filename = f"profile_{path}_{timestamp}.html"
            
            # Ensure a profiles directory exists
            os.makedirs("profiles", exist_ok=True)
            with open(f"profiles/{filename}", "w", encoding="utf-8") as f:
                f.write(profiler.output_html())
            
            logger.info(f"Performance profile saved to profiles/{filename}")

# --- Memory Monitoring ---

def get_memory_usage():
    process = psutil.Process(os.getpid())
    mem_info = process.memory_info()
    return {
        "rss": mem_info.rss / (1024 * 1024),  # MB
        "vms": mem_info.vms / (1024 * 1024),  # MB
        "percent": process.memory_percent(),
    }

async def monitor_memory(interval_seconds: int = 60):
    """Background task to log memory usage."""
    tracemalloc.start()
    logger.info("Memory monitoring started.")
    
    while True:
        try:
            mem = get_memory_usage()
            logger.info(f"Memory Usage: RSS={mem['rss']:.2f}MB, VMS={mem['vms']:.2f}MB, CPU={mem['percent']:.2f}%")
            
            # Optional: Log top allocations if memory is high
            if mem['rss'] > 500: # Example threshold
                snapshot = tracemalloc.take_snapshot()
                top_stats = snapshot.statistics('lineno')
                logger.warning("High memory usage detected! Top 5 allocations:")
                for stat in top_stats[:5]:
                    logger.warning(str(stat))
                    
        except Exception as e:
            logger.error(f"Error in memory monitor: {e}")
            
        await asyncio.sleep(interval_seconds)
