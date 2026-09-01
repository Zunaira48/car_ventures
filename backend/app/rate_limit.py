from slowapi import Limiter
from slowapi.util import get_remote_address

# In-memory storage (the default) is fine here: Render's free tier runs a single
# instance, so there's no need for a shared Redis-backed store across processes.
limiter = Limiter(key_func=get_remote_address)