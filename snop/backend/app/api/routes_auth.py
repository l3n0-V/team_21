from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class LoginIn(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(payload: LoginIn):
    # dev/mock response that matches the frontend
    return {
        "ok": True,
        "token": "dev-token",
        "user": {"id": "u1", "email": payload.email, "name": "SNOP Tester", "snops": 0},
    }
