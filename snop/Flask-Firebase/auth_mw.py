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
            # verify_id_token automatically checks expiration and revocation
            # check_revoked=True ensures revoked tokens are rejected
            decoded = auth.verify_id_token(token, check_revoked=True)
            request.user = decoded
        except auth.ExpiredIdTokenError:
            return jsonify({
                "error": "Token has expired",
                "code": "token_expired",
                "message": "Please refresh your token and try again"
            }), 401
        except auth.RevokedIdTokenError:
            return jsonify({
                "error": "Token has been revoked",
                "code": "token_revoked",
                "message": "Please sign in again"
            }), 401
        except auth.InvalidIdTokenError as e:
            return jsonify({
                "error": "Invalid token",
                "code": "token_invalid",
                "message": str(e)
            }), 401
        except Exception as e:
            print(f"Unexpected auth error: {repr(e)}")
            return jsonify({
                "error": "Authentication failed",
                "code": "auth_failed",
                "message": str(e)
            }), 401

        return f(*args, **kwargs)
    return wrapper
