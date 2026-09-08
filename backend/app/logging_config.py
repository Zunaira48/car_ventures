"""
Configures the root logger once, at app startup, so every logger.info() /
logger.warning() / logger.error() call anywhere in the app (routers,
services, ml/) actually goes somewhere instead of being silently dropped.

Without this, Python's root logger defaults to WARNING level with no handler
attached, so logger.info() calls are dropped entirely and even
logger.warning() calls only reach stderr via Python's bare "last resort"
handler - no timestamp, no module name, nothing to tell you where a log line
actually came from.

Import and call configure_logging() exactly once, before anything else runs -
main.py does this as its very first line.
"""
import logging

from app.config import settings


def configure_logging():
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        force=True,
    )