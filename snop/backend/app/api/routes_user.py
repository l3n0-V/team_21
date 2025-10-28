from fastapi import APIRouter, Header

router = APIRouter()

@router.get("/me")
def me(authorization: str | None = Header(default=None)):
    # very light mock auth
    if authorization != "Bearer dev-token":
        return {"authenticated": False}
    return {"authenticated": True, "user": {"id": "u1", "email": "tester@snop.app", "name": "SNOP Tester", "snops": 0}}
