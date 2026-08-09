import os
import sys
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Ensure the root directory is on the path so we can resolve backend package imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.models.database import init_db
from backend.routers import market, signals, picks, debate, chat, regret, portfolio, rag, voice, cards, sector_pulse, whale, wrapped, vibescore, arbitrage, forecaster

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vibeup_backend")

load_dotenv()

# Configure Gemma / Google AI Studio API
try:
    import google.generativeai as genai
    google_api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMMA_API_KEY") or os.getenv("GOOGLE_AI_STUDIO_KEY")
    if google_api_key:
        genai.configure(api_key=google_api_key)
        logger.info("Gemma AI (Google Generative AI) configured successfully.")
    else:
        logger.warning("GOOGLE_API_KEY not found in environment. Gemma Agent engine will run in fallback/mock mode.")
except Exception as e:
    logger.warning(f"Could not configure google.generativeai: {e}")


# Initialize FastAPI application
app = FastAPI(
    title="VibeUp API",
    description="Next-generation agentic financial co-pilot backend for Gen Z Indian investors.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables
@app.on_event("startup")
def on_startup():
    logger.info("Initializing database...")
    init_db()
    logger.info("Database initialized.")

# Include routers under the /api namespace
app.include_router(market.router, prefix="/api")
app.include_router(signals.router, prefix="/api")
app.include_router(picks.router, prefix="/api")
app.include_router(debate.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(regret.router, prefix="/api")
app.include_router(portfolio.router, prefix="/api")
app.include_router(rag.router, prefix="/api")
app.include_router(voice.router, prefix="/api")
app.include_router(cards.router, prefix="/api")
app.include_router(sector_pulse.router, prefix="/api")
app.include_router(whale.router, prefix="/api")
app.include_router(wrapped.router, prefix="/api")
app.include_router(vibescore.router, prefix="/api")
app.include_router(arbitrage.router, prefix="/api")
app.include_router(forecaster.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "VibeUp AI Backend is running like a vibe. Check /docs for API schema."}
