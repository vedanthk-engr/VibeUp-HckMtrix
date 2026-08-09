import json
import asyncio
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from backend.services.gemma_service import gemma_stream_response, gemma_service
from backend.services.claude_service import claude_service
from backend.services.market_service import market_service
from backend.services.news_service import news_service
from backend.services.rag_service import rag_service

router = APIRouter(prefix="/debate", tags=["Debate Arena"])

logger = logging.getLogger("debate_router")

@router.get("/{ticker}")
async def debate_ticker(ticker: str):
    """Run parallel streaming sessions: ValueBot, QuantBot, MacroBot (Claude) + GemmaBot (Gemma 4)."""
    ticker = ticker.upper()
    
    try:
        price_data = await market_service.get_stock_quote(ticker)
        news = await news_service.fetch_news(ticker)
        rag_context = await rag_service.query(f"{ticker} filings financial health", ticker=ticker)
    except Exception as e:
        logger.warning(f"Failed to gather background for debate context: {e}")
        price_data = {}
        news = []
        rag_context = []
        
    context_str = f"""
    Ticker: {ticker}
    Current Price: {price_data.get('price', 'N/A')} ({price_data.get('change', '0')}% change)
    News Highlights: {[n['title'] for n in news[:2]]}
    Regulatory filings context: {rag_context[:2]}
    """
    
    value_system = f"""
    You are ValueBot 💼. You are a conservative fundamental analyst.
    Analyze {ticker} using earnings growth, margins, P/E ratios, and debt. Focus on fundamentals and long-term valuation.
    Be specific with numbers. Max 120 words. Do not write introductory chatter. Write direct markdown bullets.
    """
    
    quant_system = f"""
    You are QuantBot 📈. You are a technical quant trader.
    Analyze {ticker} using chart patterns, moving averages, RSI, and volume breakouts. Focus on short-term price actions.
    Be specific with numbers. Max 120 words. Do not write introductory chatter. Write direct markdown bullets.
    """
    
    macro_system = f"""
    You are MacroBot 🌍. You are a macro strategist.
    Analyze {ticker} using industry tailwinds (e.g. Govt policies, capex), inflation, RBI interest rates, and global markets.
    Be specific with numbers. Max 120 words. Do not write introductory chatter. Write direct markdown bullets.
    """

    gemma_system = """You are GemmaBot, a retail market sentiment agent. 
    Analyze what everyday retail investors and social platforms are 
    saying about this stock. Focus on crowd positioning, social buzz 
    intensity, retail vs institutional divergence, and whether the 
    current narrative is driven by fundamentals or hype. 
    Be blunt. Max 120 words. Cite 2-3 specific signals."""
    
    gemma_prompt = f"""
    Analyze retail sentiment and crowd positioning for {ticker}.
    
    Sentiment data: {context_str}
    
    Structure your response as:
    - CROWD SIGNAL: (BULLISH/BEARISH/NEUTRAL with intensity)
    - KEY NARRATIVE: (what retail is saying in 1 sentence)  
    - DIVERGENCE: (where retail and institutions disagree)
    - RISK: (one specific crowd-behavior risk)
    """

    prompt = f"Perform specialized analysis for: {ticker}. Background Context:\n{context_str}"

    async def debate_generator():
        queue = asyncio.Queue()
        active_streams = 4
        
        async def stream_value():
            nonlocal active_streams
            try:
                async for chunk in claude_service.stream_completion(prompt, system_prompt=value_system):
                    await queue.put({"side": "value", "agent": "ValueBot", "model": "claude", "text": chunk})
            except Exception as ex:
                logger.error(f"Error in Value stream: {ex}")
            finally:
                active_streams -= 1
                if active_streams == 0:
                    await queue.put(None)
                    
        async def stream_quant():
            nonlocal active_streams
            try:
                async for chunk in claude_service.stream_completion(prompt, system_prompt=quant_system):
                    await queue.put({"side": "quant", "agent": "QuantBot", "model": "claude", "text": chunk})
            except Exception as ex:
                logger.error(f"Error in Quant stream: {ex}")
            finally:
                active_streams -= 1
                if active_streams == 0:
                    await queue.put(None)
                    
        async def stream_macro():
            nonlocal active_streams
            try:
                async for chunk in claude_service.stream_completion(prompt, system_prompt=macro_system):
                    await queue.put({"side": "macro", "agent": "MacroBot", "model": "claude", "text": chunk})
            except Exception as ex:
                logger.error(f"Error in Macro stream: {ex}")
            finally:
                active_streams -= 1
                if active_streams == 0:
                    await queue.put(None)

        async def stream_gemma():
            nonlocal active_streams
            try:
                async for chunk in gemma_stream_response(gemma_prompt, system=gemma_system):
                    await queue.put({"side": "gemma", "agent": "GemmaBot", "model": "gemma", "text": chunk})
            except Exception as ex:
                logger.error(f"Error in GemmaBot stream: {ex}")
            finally:
                active_streams -= 1
                if active_streams == 0:
                    await queue.put(None)

        # Start 4 parallel agent streams
        asyncio.create_task(stream_value())
        asyncio.create_task(stream_quant())
        asyncio.create_task(stream_macro())
        asyncio.create_task(stream_gemma())
        
        while True:
            item = await queue.get()
            if item is None:
                break
            yield f"data: {json.dumps(item)}\n\n"
            
        try:
            consensus_prompt = f"""
            Synthesize market consensus for {ticker} based on Price: {price_data}, News: {[n['title'] for n in news[:2]]}.
            Return JSON: {{"score": 78, "summary": "Gemma 4 Multi-Agent consensus confirms bullish momentum for {ticker}."}}
            """
            
            consensus_res = await gemma_service.json_completion(
                consensus_prompt, 
                system_prompt="You are Gemma 4 Multi-Agent Committee Chairman. Respond only in JSON."
            )
            
            score = consensus_res.get('score', 75)
            summary = consensus_res.get('summary', f'Gemma 4 verified consensus for {ticker}.')
            yield f"data: {json.dumps({'side': 'consensus', 'agent': 'Orchestrator', 'model': 'gemma', 'score': score, 'summary': summary})}\n\n"
        except Exception as e:
            logger.error(f"Failed to generate consensus score: {e}")
            yield f"data: {json.dumps({'side': 'consensus', 'agent': 'Orchestrator', 'model': 'gemma', 'score': 70, 'summary': f'Gemma 4 consensus active for {ticker}.'})}\n\n"
            
        yield "data: [DONE]\n\n"

    return StreamingResponse(debate_generator(), media_type="text/event-stream")
