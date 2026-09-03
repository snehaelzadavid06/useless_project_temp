from fastapi import FastAPI
from pydantic import BaseModel

from .auth_service import create_password, authenticate


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
def create_password_endpoint(data: PasswordSequence):
    success = create_password(data.sequence)

    if success:
        return {
            "success": True,
            "message": "Password created successfully!"
        }

    return {
        "success": False,
        "message": "Password sequence cannot be empty."
    }

@app.post("/password/verify")
def check_password(data: PasswordSequence):
    result = authenticate(data.sequence)

    if result:
        return {
            "authenticated": True,
            "message": "ACCESS GRANTED!"
        }

    return {
        "authenticated": False,
        "message": "ACCESS DENIED!"
    }