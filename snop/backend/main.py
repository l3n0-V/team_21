from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes_auth import router as auth_router
from app.api.routes_audio import router as audio_router
from app.api.routes_challenges import router as challenges_router
from app.api.routes_user import router as user_router

app = FastAPI(title="SNOP API", version="0.1.0")

# CORS – allow Expo Go & local web during dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # dev-friendly; tighten for prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

# Routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(audio_router, prefix="/audio", tags=["audio"])
app.include_router(challenges_router, prefix="/challenges", tags=["challenges"])
app.include_router(user_router, prefix="/user", tags=["user"])
