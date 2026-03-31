"""Security helpers for the FitOps backend."""

from __future__ import annotations

import hashlib
import hmac
import os

from itsdangerous import BadSignature, BadTimeSignature, URLSafeTimedSerializer

ALGORITHM = "pbkdf2_sha256"
ITERATIONS = 390000
SALT_BYTES = 16
TOKEN_SALT = "fitops-auth-token"
DEFAULT_SECRET_KEY = "fitops-dev-secret-change-me"


def hash_password(password: str) -> str:
    """Hash a plaintext password using PBKDF2."""

    salt = os.urandom(SALT_BYTES).hex()
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt),
        ITERATIONS,
    ).hex()
    return f"{ALGORITHM}${ITERATIONS}${salt}${digest}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Check a plaintext password against the stored value.

    Older demo databases may still contain plain placeholder values. Those are
    treated as raw strings so existing local setups do not break unexpectedly.
    """

    if not stored_hash:
        return False

    if not stored_hash.startswith(f"{ALGORITHM}$"):
        return hmac.compare_digest(password, stored_hash)

    try:
        _, iterations, salt, expected = stored_hash.split("$", 3)
    except ValueError:
        return False

    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt),
        int(iterations),
    ).hex()
    return hmac.compare_digest(digest, expected)


def _token_serializer() -> URLSafeTimedSerializer:
    secret_key = os.getenv("FITOPS_SECRET_KEY", DEFAULT_SECRET_KEY)
    return URLSafeTimedSerializer(secret_key=secret_key, salt=TOKEN_SALT)


def generate_auth_token(payload: dict) -> str:
    """Create a signed auth token for API clients."""

    return _token_serializer().dumps(payload)


def verify_auth_token(token: str, max_age: int | None = None) -> dict | None:
    """Verify and decode an auth token."""

    try:
        return _token_serializer().loads(token, max_age=max_age)
    except (BadSignature, BadTimeSignature):
        return None
