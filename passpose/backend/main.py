from fastapi import FastAPI
from pydantic import BaseModel

from .password_manager import save_password, verify_password


app = FastAPI()


class PasswordSequence(BaseModel):
    sequence: list[str]


@app.get("/")
def home():
    return {
        "message": "Welcome to PassPose!"
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }


@app.post("/password/create")
def create_password(data: PasswordSequence):

    save_password(data.sequence)

    return {
        "message": "Password created successfully!"
    }


@app.post("/password/verify")
def check_password(data: PasswordSequence):

    result = verify_password(data.sequence)

    if result:
        return {
            "authenticated": True,
            "message": "ACCESS GRANTED!"
        }

    return {
        "authenticated": False,
        "message": "ACCESS DENIED!"
    }