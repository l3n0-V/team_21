import uuid, datetime
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Header
from app.core.firebase import db, bucket

router = APIRouter()

@router.post("/score")
async def score_audio(
    audio: UploadFile = File(...),
    prompt: str = Form(""),
    authorization: str | None = Header(default=None)  # "Bearer dev-token" for now
):
    uid = "dev-u1"  # TODO: map token→uid when real auth
    if not audio.filename:
        raise HTTPException(400, "No audio file")

    attempt_id = str(uuid.uuid4())
    blob_path = f"audio/{uid}/{attempt_id}.m4a"
    blob = bucket.blob(blob_path)
    blob.content_type = audio.content_type or "audio/m4a"
    blob.upload_from_file(audio.file)  # stream upload

    # mock AI result
    result = {
        "text": "hello world",
        "pronunciationScore": 78,
        "grammarTips": ["Mind the /r/", "Slow down endings."],
        "snops": 5
    }

    # save metadata
    doc = {
        "uid": uid,
        "attemptId": attempt_id,
        "challengePrompt": prompt,
        "storagePath": blob_path,
        "result": result,
        "createdAt": datetime.datetime.utcnow()
    }
    db.collection("attempts").document(f"{uid}_{attempt_id}").set(doc)

    # (optional) increment user snops
    db.collection("users").document(uid).set({"snops": firestore.Increment(result["snops"])}, merge=True)

    return result
