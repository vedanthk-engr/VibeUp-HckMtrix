from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from backend.services.market_service import market_service

router = APIRouter(prefix="/market", tags=["Market Data"])

@router.get("/indices")
async def get_market_indices():
    """Fetch live Nifty 50, Sensex, and index percentage changes."""
    try:
        data = await market_service.get_indices()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/quote/{symbol}")
async def get_stock_quote(symbol: str):
    """Get standard stock quote with open/high/low/close metrics."""
    try:
        quote = await market_service.get_stock_quote(symbol)
        return quote
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Stock {symbol} not found: {str(e)}")

@router.get("/historical/{symbol}")
async def get_historical_data(symbol: str, period: str = Query("1y", description="Timeframe (1d, 5d, 1mo, 3mo, 1y, 5y, max)")):
    """Fetch historical daily candles for charts."""
    try:
        data = await market_service.get_historical(symbol, period)
        if not data:
            # Should not happen with fallback generators, but just in case
            data = market_service._generate_fallback_historical(symbol.upper(), period)
        return data
    except Exception as e:
        # Even on exception, return fallback data so charts always render
        try:
            return market_service._generate_fallback_historical(symbol.upper(), period)
        except Exception:
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/intraday/{symbol}")
async def get_intraday_data(symbol: str):
    """Fetch 1-minute candlestick data for the current session."""
    try:
        data = await market_service.get_intraday(symbol)
        if not data:
            data = market_service._generate_fallback_intraday(symbol.upper())
        return data
    except Exception as e:
        try:
            return market_service._generate_fallback_intraday(symbol.upper())
        except Exception:
            raise HTTPException(status_code=500, detail=str(e))

