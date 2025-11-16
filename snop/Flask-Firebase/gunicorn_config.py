"""
Gunicorn configuration for SNOP Backend.
Production-ready WSGI server configuration.
"""
import os
import multiprocessing

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', 8000)}"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 120  # 2 minutes for pronunciation evaluation
keepalive = 5

# Logging
accesslog = "-"  # Log to stdout
errorlog = "-"   # Log to stderr
loglevel = os.getenv("LOG_LEVEL", "info").lower()
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "snop-backend"

# Server mechanics
daemon = False  # Don't daemonize (let Docker/systemd handle this)
pidfile = None
user = None
group = None
umask = 0
tmp_upload_dir = None

# SSL (optional - usually handled by reverse proxy)
# keyfile = None
# certfile = None

# Server hooks
def on_starting(server):
    """Called just before the master process is initialized."""
    print("🚀 Starting SNOP Backend with Gunicorn")

def on_reload(server):
    """Called when a worker is reloaded."""
    print("♻️  Reloading worker processes")

def when_ready(server):
    """Called just after the server is started."""
    print(f"✅ SNOP Backend ready on {bind}")

def on_exit(server):
    """Called just before exiting."""
    print("👋 Shutting down SNOP Backend")
