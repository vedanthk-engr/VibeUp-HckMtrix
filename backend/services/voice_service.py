import os
import httpx
import logging
from typing import AsyncGenerator
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
load_dotenv()

logger = logging.getLogger("voice_service")

class VoiceService:
    @property
    def api_key(self) -> str:
        return os.getenv("ELEVENLABS_API_KEY", "")

    @property
    def voice_id(self) -> str:
        return os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
        
    async def generate_speech_bytes(self, text: str) -> bytes:
        """Convert text to speech and return raw audio bytes."""
        key = self.api_key
        if not key:
            logger.warning("ELEVENLABS_API_KEY missing. Cannot generate audio via ElevenLabs.")
            raise ValueError("ElevenLabs API Key not set.")
            
        voice_id = self.voice_id
        # Fallback to premade Sarah voice if voice_id is invalid or custom (prevents 402 paid voice error)
        if not voice_id or len(voice_id) < 10 or voice_id == "vZzlAds9NzvLsFSWp0qk":
            voice_id = "EXAVITQu4vr4xnSDxMaL"  # Sarah (premade voice)

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "xi-api-key": key,
            "Content-Type": "application/json"
        }
        data = {
            "text": text[:1000],  # cap at 1000 chars per speech snippet
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=data)
            if response.status_code != 200:
                logger.error(f"ElevenLabs TTS error: {response.status_code} - {response.text}")
                raise Exception(f"ElevenLabs TTS service error: {response.status_code}")
            return response.content

voice_service = VoiceService()
