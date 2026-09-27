"""Authentication helpers: email validation and password hashing.

Passwords are never stored in plain text. We store a PBKDF2-HMAC-SHA256
hash in the format:  pbkdf2_sha256$<salt>$<hex-hash>

- PBKDF2 is a one-way function: you cannot reverse the stored value back
  into the original password.
- Each user gets a unique random salt, so identical passwords produce
  different stored values and precomputed ("rainbow table") attacks fail.
"""

import hashlib
import hmac
import re
import secrets

# Standard, permissive email pattern: local-part @ domain . tld
# Rejects "xx" (no @) and "xx@xx" (no dot / no top-level domain).
EMAIL_RE = re.compile(
    r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$"
)

ALGORITHM = "pbkdf2_sha256"
ITERATIONS = 260_000  # cost factor for new accounts
SALT_BYTES = 16


def is_valid_email(email: str) -> bool:
    """True only for real-looking addresses like test@test.something."""
    email = email.strip()
    if len(email) > 254 or ".." in email:
        return False
    return bool(EMAIL_RE.match(email))


def _derive(password: str, salt: str, iterations: int) -> str:
    dk = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations
    )
    return dk.hex()


def hash_password(password: str) -> str:
    """Return a storable hash string; the plain password is never kept."""
    salt = secrets.token_hex(SALT_BYTES)
    digest = _derive(password, salt, ITERATIONS)
    return f"{ALGORITHM}${salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    """Check a login attempt against a stored hash, without ever
    decrypting it. Supports the 3-part seed format and, for robustness,
    an optional 4-part format that also records the iteration count."""
    try:
        parts = stored.split("$")
        if len(parts) == 3:
            algo, salt, expected = parts
            iterations = ITERATIONS
        elif len(parts) == 4:
            algo, iter_str, salt, expected = parts
            iterations = int(iter_str)
        else:
            return False
        if algo != ALGORITHM:
            return False
    except (ValueError, AttributeError):
        return False
    candidate = _derive(password, salt, iterations)
    # Constant-time comparison avoids leaking timing information.
    return hmac.compare_digest(candidate, expected)
