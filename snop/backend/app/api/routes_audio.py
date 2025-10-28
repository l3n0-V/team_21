import tempfile, uuid, os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

router = APIRouter()

@router.post("/score")
async def score_audio(
    audio: UploadFile = File(..., description="m4a/wav/ogg recording"),
    prompt: str = Form(""),
):
    if audio.content_type not in {"audio/m4a", "audio/mp4", "audio/aac", "audio/x-m4a", "audio/wav", "audio/ogg", "audio/mpeg"}:
        raise HTTPException(status_code=415, detail=f"Unsupported content type: {audio.content_type}")

    # Save temp (so you can wire Whisper later)
    fname = f"{uuid.uuid4()}.{audio.filename.split('.')[-1]}"
    tmp_dir = tempfile.gettempdir()
    fpath = os.path.join(tmp_dir, fname)
    with open(fpath, "wb") as f:
        f.write(await audio.read())

    # TODO: plug Whisper + pronunciation + grammar here.
    # For now return the exact shape the app expects:
    return {
        "text": "hello world",                 # STT result placeholder
        "pronunciationScore": 78,              # 0–100
        "grammarTips": ["Mind the /r/", "Slow down endings."],
        "snops": 5,
        "prompt": prompt,
        "tmp_file": fpath,                     # helps you debug locally
    }
