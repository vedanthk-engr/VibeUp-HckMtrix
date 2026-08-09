from fastapi import APIRouter, HTTPException, Response
from backend.models.schemas import TTSRequest
from backend.services.voice_service import voice_service

router = APIRouter(prefix="/voice", tags=["Voice Engine"])

@router.post("/tts")
async def text_to_speech(request: TTSRequest):
    """Convert text response to speech audio using ElevenLabs API."""
    try:
        audio_bytes = await voice_service.generate_speech_bytes(request.text)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except ValueError as ve:
        # Graceful response in case keys are not set, signaling the client to fallback
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate TTS: {str(e)}")
