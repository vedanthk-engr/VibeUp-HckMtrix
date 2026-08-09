import json
import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from backend.services.signal_engine import signal_engine
from backend.services.gemma_service import run_signal_agent

router = APIRouter(prefix="/signals", tags=["Live Signals"])

POPULAR_TICKERS = [
    "ZOMATO", "TITAN", "ADANIPORTS", "TATASTEEL", "INFY", 
    "RELIANCE", "TCS", "PAYTM", "HAL", "HDFCBANK", 
    "ICICIBANK", "ITC", "SBIN", "BHARTIARTL", "LTIM", 
    "MARUTI", "TATACHEM", "JIOFIN", "IREDA", "RVNL", 
    "PFC", "ONGC"
]

@router.get("/ticker/{symbol}")
async def get_signal_for_ticker(symbol: str):
    """Retrieve signal status for a specific stock powered by Gemma 4."""
    try:
        sig = await signal_engine.generate_signal(symbol)
        sig["powered_by"] = "gemma"
        return sig
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stream")
async def stream_live_signals():
    """Stream live trade signals via Server-Sent Events (SSE) to the frontend feed."""
    async def event_generator():
        # First stream initial set of signals
        for ticker in POPULAR_TICKERS:
            try:
                sig = await signal_engine.generate_signal(ticker)
                sig["powered_by"] = "gemma"
                yield f"data: {json.dumps(sig)}\n\n"
                # Small gap between streams to show loader animations in UI
                await asyncio.sleep(0.5)
            except Exception as e:
                # Keep streaming next items even if one fails
                continue
        
        # Stream complete signal to notify client we finished initial loading
        yield f"data: {json.dumps({'status': 'complete'})}\n\n"
                
        # Heartbeat loop / Slow update stream
        while True:
            await asyncio.sleep(30)
            yield f"data: {json.dumps({'heartbeat': True})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

