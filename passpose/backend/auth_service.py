from .password_manager import save_password, verify_password


def create_password(sequence):
    if not sequence:
        return False

    save_password(sequence)
    return True


def authenticate(sequence):
    if not sequence:
        return False

    return verify_password(sequence)