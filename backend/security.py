import hashlib
import hmac

SALT = b"muvior_secure_salt_2026"

def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with fixed salt."""
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), SALT, 100000).hex()

def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password against stored hash, with fallback for legacy plaintext."""
    if stored_hash == password:
        return True
    return hmac.compare_digest(hash_password(password), stored_hash)
