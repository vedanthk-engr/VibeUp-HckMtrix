import json
import asyncio
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from backend.models.schemas import ChatRequest
from backend.services.gemma_service import (
    gemma_stream_response, 
    run_research_agent,
    run_risk_agent,
    gemma_memory
)
from backend.services.rag_service import rag_service
from backend.services.claude_service import claude_service

router = APIRouter(prefix="/chat", tags=["AI Copilot Chat"])

logger = logging.getLogger("chat_router")

COMPLEX_TRIGGERS = [
    "should i", "analyze", "portfolio", "stress", 
    "compare", "what happens if", "risk", "recommend",
    "buy or sell", "thesis", "deep dive"
]

def is_complex_query(message: str) -> bool:
    return any(trigger in message.lower() for trigger in COMPLEX_TRIGGERS)

def extract_ticker(message: str) -> str:
    for word in message.upper().replace(":", " ").replace(".", " ").replace("?", " ").split():
        if len(word) >= 3 and word.isupper() and word not in ["NSE", "FII", "RSI", "PE", "GST", "STT", "CAGR", "RBI", "FD", "ROE", "ROCE", "JSON", "EMA"]:
            return word
    return ""

@router.post("")
async def chat_copilot(request: ChatRequest):
    """Chat with Co-pilot AI agent powered by Gemma 4 Agent Pipeline."""
    try:
        user_ctx = request.user_context or {}
        user_id = user_ctx.get("user_id", "default_user")
        portfolio = {"summary": user_ctx.get("portfolio_summary", "No holdings")}
        archetype = user_ctx.get("risk_archetype", "Growth Investor")

        msg_payload = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        last_user_msg = ""
        if msg_payload:
            last_msg = msg_payload[-1]["content"]
            if isinstance(last_msg, list):
                text_parts = [part.get("text", "") for part in last_msg if isinstance(part, dict) and part.get("type") == "text"]
                last_user_msg = " ".join(text_parts)
            else:
                last_user_msg = str(last_msg)

        message = last_user_msg or "Market overview"

        # Update memory with this interaction
        gemma_memory.update_memory(user_id, "recent_action", {
            "type": "chat_query",
            "message": message[:100]
        })

        async def response_streamer():
            try:
                if is_complex_query(message):
                    # COMPLEX PATH: invoke Research Agent + Risk Agent in parallel
                    rag_context = await rag_service.query(message)
                    ticker = extract_ticker(message) or "PORTFOLIO"

                    research_result, risk_result = await asyncio.gather(
                        run_research_agent(message, rag_context),
                        run_risk_agent(
                            ticker=ticker,
                            action=message,
                            portfolio=portfolio,
                            archetype=archetype
                        )
                    )

                    synthesis_prompt = f"""
                    User asked: {message}
                    
                    Research Agent found: {json.dumps(research_result)}
                    Risk Agent assessed: {json.dumps(risk_result)}
                    
                    Synthesize these into a helpful, direct response for a Gen Z 
                    Indian investor. Plain English. Max 100 words. Cite sources 
                    from research. Flag risks from risk assessment. End with DYOR 
                    if recommending a specific action.
                    """

                    async for chunk in gemma_stream_response(
                        synthesis_prompt, 
                        user_id=user_id
                    ):
                        yield f"data: {json.dumps({'text': chunk, 'model': 'gemma', 'path': 'agent_pipeline'})}\n\n"

                else:
                    # SIMPLE PATH: direct Gemma stream
                    system = """You are AUREX, VibeUp's AI financial co-pilot for 
                    Gen Z Indian investors. Be direct, specific, max 80 words."""
                    
                    async for chunk in gemma_stream_response(
                        message, 
                        system=system,
                        user_id=user_id
                    ):
                        yield f"data: {json.dumps({'text': chunk, 'model': 'gemma', 'path': 'direct'})}\n\n"

            except Exception as ex:
                logger.error(f"Gemma chat stream error: {ex}. Falling back to Claude.")
                try:
                    async for chunk in claude_service.stream_completion(message):
                        yield f"data: {json.dumps({'text': chunk, 'model': 'claude', 'path': 'fallback'})}\n\n"
                except Exception as inner_ex:
                    yield f"data: {json.dumps({'text': f'Error streaming response: {str(inner_ex)}', 'model': 'fallback', 'path': 'error'})}\n\n"

            yield "data: [DONE]\n\n"

        return StreamingResponse(response_streamer(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
