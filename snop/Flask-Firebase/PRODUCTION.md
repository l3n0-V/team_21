# Production Deployment Guide

## Overview

This guide covers the production-ready features implemented in the SNOP Backend, including environment-based configuration, error handling, rate limiting, logging, and deployment with Gunicorn.

---

## Features Implemented

### 1. Environment-Based Configuration ✅

**File:** `config.py`

The backend now supports three environments:
- **Development** - Local development with debug mode
- **Staging** - Testing environment
- **Production** - Production deployment with security hardening

**Usage:**

Set the `FLASK_ENV` environment variable:

```bash
# Development (default)
export FLASK_ENV=development
python app.py

# Staging
export FLASK_ENV=staging
python app.py

# Production
export FLASK_ENV=production
gunicorn -c gunicorn_config.py app:app
```

**Configuration Differences:**

| Feature | Development | Staging | Production |
|---------|------------|---------|------------|
| DEBUG | True | False | False |
| SESSION_COOKIE_SECURE | False | True | True |
| MOCK Services | Enabled | Enabled | Disabled |
| LOG_LEVEL | DEBUG | INFO | WARNING |

---

### 2. Custom Error Handling ✅

**Implemented in:** `app.py`

**Custom Exception Classes:**
- `APIError` - Base exception for all API errors
- `ValidationError` - For request validation errors (400)
- `NotFoundError` - For resource not found errors (404)
- `AuthenticationError` - For authentication failures (401)
- `PronunciationEvaluationError` - For Whisper API errors (500)

**Error Handlers:**
- Centralized error handling with proper HTTP status codes
- Structured error responses in JSON format
- Automatic logging of errors with stack traces

**Example Usage:**

```python
from app import ValidationError, NotFoundError

# Raise custom error
if not challenge:
    raise NotFoundError("Challenge not found")

# Validation error
if not email:
    raise ValidationError("Email is required")
```

**Error Response Format:**

```json
{
  "error": "Challenge not found"
}
```

---

### 3. Rate Limiting ✅

**Library:** Flask-Limiter 3.5.0

**Default Limits:**
- 200 requests per day per IP
- 50 requests per hour per IP

**Endpoint-Specific Limits:**
- `/scoreDaily`: 20 per hour (prevents Whisper API abuse)
- `/auth/register`: 5 per hour (prevents spam registration)

**Rate Limit Headers:**

Responses include rate limit information:
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1699876543
```

**Rate Limit Exceeded Response:**

```json
{
  "error": "429 Too Many Requests: 20 per 1 hour"
}
```

**Customizing Rate Limits:**

```python
@app.post("/my-endpoint")
@limiter.limit("10 per minute")
def my_endpoint():
    pass
```

---

### 4. Structured Logging ✅

**Configuration in:** `config.py`, `app.py`

**Log Levels by Environment:**
- Development: DEBUG (all logs)
- Staging: INFO (important events)
- Production: WARNING (errors and warnings only)

**Log Format:**

```
2025-11-13 15:30:45 - __main__ - INFO - Starting SNOP Backend in development mode
2025-11-13 15:30:45 - __main__ - INFO - Firebase initialized successfully
2025-11-13 15:31:02 - __main__ - WARNING - API Error: Challenge not found (Status: 404)
```

**Using the Logger:**

```python
logger.debug("Debugging information")
logger.info("Informational message")
logger.warning("Warning message")
logger.error("Error occurred", exc_info=True)  # Includes stack trace
```

**Logged Events:**
- Application startup and configuration
- Firebase initialization
- API errors and exceptions
- Rate limit violations
- 404 Not Found requests
- Internal server errors

---

### 5. Production Server (Gunicorn) ✅

**File:** `gunicorn_config.py`

**Features:**
- Multi-worker process management
- Automatic worker count based on CPU cores
- 120-second timeout for long-running pronunciation evaluations
- Access and error logging to stdout/stderr
- Process naming for monitoring

**Worker Calculation:**
```
workers = (CPU cores × 2) + 1
```

**Starting Production Server:**

```bash
# Install Gunicorn (already in requirements.txt)
pip install gunicorn

# Start with config file
gunicorn -c gunicorn_config.py app:app

# Or with custom port
PORT=8080 gunicorn -c gunicorn_config.py app:app
```

**Gunicorn Logs:**

```
🚀 Starting SNOP Backend with Gunicorn
✅ SNOP Backend ready on 0.0.0.0:8000
[2025-11-13 15:30:45] [12345] [INFO] Starting gunicorn 21.2.0
[2025-11-13 15:30:45] [12345] [INFO] Listening at: http://0.0.0.0:8000
[2025-11-13 15:30:45] [12346] [INFO] Booting worker with pid: 12346
```

---

## Environment Variables

### Required Variables

```bash
# Firebase
FIREBASE_CREDENTIALS_PATH=./firebase-auth.json

# Flask
SECRET_KEY=<your-secret-key>  # Use secrets.token_hex(32)

# CORS
CORS_ORIGINS=http://localhost:8081,https://yourdomain.com
```

### Optional Variables

```bash
# Environment
FLASK_ENV=production  # development, staging, production

# Server
PORT=8000
HOST=0.0.0.0

# Features
USE_MOCK_PRONUNCIATION=false
USE_MOCK_LEADERBOARD=false

# OpenAI (required for real pronunciation evaluation)
OPENAI_API_KEY=<your-openai-api-key>

# Logging
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR, CRITICAL
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Set `FLASK_ENV=production`
- [ ] Generate strong `SECRET_KEY`
- [ ] Set `USE_MOCK_PRONUNCIATION=false`
- [ ] Set `USE_MOCK_LEADERBOARD=false`
- [ ] Add production domain to `CORS_ORIGINS`
- [ ] Verify `OPENAI_API_KEY` is set
- [ ] Update `firebase-auth.json` with production credentials
- [ ] Test all endpoints in staging environment

### Deployment

- [ ] Install production dependencies: `pip install -r requirements.txt`
- [ ] Run database migrations (if any)
- [ ] Seed challenges: `python migrate_challenges.py`
- [ ] Start Gunicorn: `gunicorn -c gunicorn_config.py app:app`
- [ ] Verify health check: `curl http://localhost:8000/health`
- [ ] Check logs for errors
- [ ] Test critical endpoints

### Post-Deployment

- [ ] Monitor error logs
- [ ] Check rate limiting is working
- [ ] Verify Firebase connection
- [ ] Test Whisper API integration
- [ ] Monitor performance metrics
- [ ] Set up alerts for errors

---

## Docker Deployment (Optional)

### Dockerfile Example

```dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "-c", "gunicorn_config.py", "app:app"]
```

### Running with Docker

```bash
# Build
docker build -t snop-backend .

# Run
docker run -d \
  -p 8000:8000 \
  -e FLASK_ENV=production \
  -e SECRET_KEY=<your-secret> \
  -v $(pwd)/firebase-auth.json:/app/firebase-auth.json \
  --name snop-backend \
  snop-backend
```

---

## Monitoring & Logging

### Health Check Endpoint

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "ok"
}
```

### Log Monitoring

```bash
# View real-time logs
tail -f /var/log/snop/error.log

# With Gunicorn (stdout/stderr)
gunicorn -c gunicorn_config.py app:app 2>&1 | tee snop.log
```

### Metrics to Monitor

- Request rate per endpoint
- Error rate (4xx, 5xx responses)
- Response time (especially /scoreDaily)
- Rate limit violations
- Worker process health
- Firebase connection status
- Whisper API response time

---

## Troubleshooting

### Issue: 429 Too Many Requests

**Cause:** Rate limit exceeded

**Solution:**
- Increase rate limit for endpoint
- Implement exponential backoff in client
- Use caching for repeated requests

### Issue: 500 Internal Server Error

**Cause:** Unhandled exception

**Solution:**
- Check logs for stack trace
- Verify environment variables
- Check Firebase credentials
- Verify Whisper API key

### Issue: SESSION_COOKIE_SECURE Error in Development

**Cause:** HTTPS required but using HTTP

**Solution:**
```bash
# Use development environment
export FLASK_ENV=development
python app.py
```

### Issue: Worker Timeout

**Cause:** Pronunciation evaluation taking too long

**Solution:**
- Increase timeout in `gunicorn_config.py`
- Switch to async workers
- Optimize Whisper API calls

---

## Security Best Practices

### ✅ Implemented

- HTTPS-only session cookies in production
- CSRF protection with SameSite cookies
- HTTPOnly cookies to prevent XSS
- Rate limiting to prevent abuse
- Error handling without exposing sensitive data
- Structured logging for security auditing

### 🔄 Recommended

- [ ] Add API key authentication for mobile app
- [ ] Implement request signing
- [ ] Add IP whitelisting for admin endpoints
- [ ] Enable HTTPS/TLS in reverse proxy
- [ ] Implement request validation middleware
- [ ] Add security headers (HSTS, X-Frame-Options, etc.)
- [ ] Regular dependency updates
- [ ] Penetration testing

---

## Performance Optimization

### Current Optimizations

- Multi-worker Gunicorn deployment
- Connection pooling for Firebase
- Rate limiting to prevent overload
- Efficient Firestore queries with indexing

### Future Optimizations

- Response caching for leaderboards
- CDN for static assets
- Database query optimization
- Load balancing across multiple instances
- Redis for rate limiting (instead of memory)
- Background task queue for async operations

---

## Summary

The SNOP Backend is now **production-ready** with:

✅ **Environment-based configuration** (dev/staging/prod)
✅ **Custom error handling** with structured responses
✅ **Rate limiting** to prevent abuse
✅ **Structured logging** for debugging and monitoring
✅ **Gunicorn** for production deployment

**Next Steps:**
1. Deploy to staging environment
2. Run full integration tests
3. Monitor performance and errors
4. Deploy to production
5. Set up monitoring and alerts

---

**Last Updated:** November 13, 2025
**Status:** Production Ready
