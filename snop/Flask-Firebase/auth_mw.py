from functools import wraps
from flask import request, jsonify
from firebase_admin import auth

def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify({"error": "Missing bearer token"}), 401
        token = header.split(" ", 1)[1]
        try:
            decoded = auth.verify_id_token(token)
            request.user = decoded
        except Exception as e:
            # TEMP: print exact cause to the terminal
            print("Auth verify_id_token error:", repr(e))
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return wrapper
