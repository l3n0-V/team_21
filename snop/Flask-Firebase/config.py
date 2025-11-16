"""
Flask application configuration.
Handles environment-based settings for development, staging, and production.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration with default values."""

    # Flask Core
    SECRET_KEY = os.getenv('SECRET_KEY', os.urandom(24).hex())
    DEBUG = False
    TESTING = False

    # Session Configuration
    SESSION_COOKIE_SECURE = True  # Require HTTPS
    SESSION_COOKIE_HTTPONLY = True  # Prevent JavaScript access
    SESSION_COOKIE_SAMESITE = 'Lax'  # CSRF protection
    PERMANENT_SESSION_LIFETIME = 86400  # 1 day in seconds
    SESSION_REFRESH_EACH_REQUEST = True

    # CORS
    CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]

    # Firebase
    FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-auth.json")

    # OpenAI
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

    # Feature Flags
    USE_MOCK_PRONUNCIATION = os.getenv("USE_MOCK_PRONUNCIATION", "true").lower() == "true"
    USE_MOCK_LEADERBOARD = os.getenv("USE_MOCK_LEADERBOARD", "true").lower() == "true"

    # Server
    PORT = int(os.getenv("PORT", 5000))
    HOST = os.getenv("HOST", "0.0.0.0")

    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'


class DevelopmentConfig(Config):
    """Development configuration."""

    DEBUG = True
    SESSION_COOKIE_SECURE = False  # Allow HTTP for local development
    LOG_LEVEL = "DEBUG"


class StagingConfig(Config):
    """Staging configuration."""

    DEBUG = False
    TESTING = True
    LOG_LEVEL = "INFO"


class ProductionConfig(Config):
    """Production configuration."""

    DEBUG = False
    TESTING = False

    # Production should always use real services
    USE_MOCK_PRONUNCIATION = False
    USE_MOCK_LEADERBOARD = False

    # Stricter session settings
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Strict'

    LOG_LEVEL = "WARNING"


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'staging': StagingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}


def get_config():
    """Get the configuration based on FLASK_ENV environment variable."""
    env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, config['default'])
