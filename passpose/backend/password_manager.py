import json
import os


PASSWORD_FILE = "passpose/backend/password.json"


def save_password(sequence):

    data = {
        "password": sequence
    }

    with open(PASSWORD_FILE, "w") as file:
        json.dump(data, file, indent=4)

    print("Password saved successfully!")


def load_password():

    if not os.path.exists(PASSWORD_FILE):
        return None

    with open(PASSWORD_FILE, "r") as file:
        data = json.load(file)

    return data["password"]


def verify_password(sequence):

    saved_password = load_password()

    if saved_password is None:
        return False

    return sequence == saved_password