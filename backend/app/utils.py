import bcrypt

def hash_password(password: str) -> str:
    """
    This will be used when creating a User. We will hash the given password using bcrypt and return it.
    """
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    Returns True if the passwords match, False otherwise.
    """
    try:
        # bcrypt.checkpw automatically handles different salt versions
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except ValueError:
        # Handles cases where the hashed_password might be malformed or not a bcrypt hash
        return False