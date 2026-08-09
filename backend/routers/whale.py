import json
import asyncio
import random
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.models.database import get_db, DBWhaleAlert, DBNotification
from backend.services.auth_service import get_current_user

router = APIRouter(prefix="/whale", tags=["Whale Tracker"])
logger = logging.getLogger("whale_router")

class AlertCreateRequest(BaseModel):
    user_id: str
    ticker: str
    threshold: float

# Real-looking SEBI Insider Moves
INSIDER_MOVES = [
    {"company": "Reliance Industries", "ticker": "RELIANCE", "insider": "Devarshi Commercials (Promoter Group)", "side": "BUY", "shares": 150000, "date": "2026-06-18", "holding_pct": 50.15, "aurex_read": "Promoter buying reinforces core support. Bullish signal."},
    {"company": "Zomato Limited", "ticker": "ZOMATO", "insider": "Deepinder Goyal (Founder/MD)", "side": "SELL", "shares": 850000, "date": "2026-06-15", "holding_pct": 4.12, "aurex_read": "Routine liquidity diversification, watch if sizing increases."},
    {"company": "Titan Company Ltd", "ticker": "TITAN", "insider": "Tata Sons Private Ltd (Promoter)", "side": "BUY", "shares": 45000, "date": "2026-06-19", "holding_pct": 52.92, "aurex_read": "Parent entity expanding ownership at local dips. High conviction."},
    {"company": "Trent Limited", "ticker": "TRENT", "insider": "Noel Naval Tata (Director)", "side": "BUY", "shares": 12000, "date": "2026-06-16", "holding_pct": 2.45, "aurex_read": "Key insider increasing stakes before earnings season. Bullish."},
    {"company": "HAL", "ticker": "HAL", "insider": "Govt of India (Promoter)", "side": "SELL", "shares": 1200000, "date": "2026-06-12", "holding_pct": 71.60, "aurex_read": "Govt OFS divestment to meet public shareholding norms. Mid-term supply overhang."},
    {"company": "Adani Enterprises", "ticker": "ADANIENT", "insider": "Adani Tradeline LLP (Promoter)", "side": "BUY", "shares": 540000, "date": "2026-06-17", "holding_pct": 61.20, "aurex_read": "Promoter defense buying during media reports. High risk control."},
    {"company": "DLF Limited", "ticker": "DLF", "insider": "Rajiv Singh (Promoter)", "side": "SELL", "shares": 300000, "date": "2026-06-14", "holding_pct": 58.40, "aurex_read": "Routine portfolio rebalancing. No major changes expected."},
    {"company": "Zee Entertainment", "ticker": "ZEEL", "insider": "Punit Goenka (CEO)", "side": "SELL", "shares": 180000, "date": "2026-06-10", "holding_pct": 1.10, "aurex_read": "Insider trimming holdings amidst restructuring delays. Risk alert."}
]

# Preset MF fresh buying (past month)
MF_BUYING = [
    {"ticker": "TRENT", "schemes": "SBI Bluechip, HDFC Top 200", "units": 1240000, "value": 580, "consensus": True},
    {"ticker": "JIOFIN", "schemes": "Parag Parikh Flexi, Nippon Smallcap", "units": 8900000, "value": 310, "consensus": True},
    {"ticker": "HAL", "schemes": "ICICI Pru Balanced, Kotak Equity", "units": 450000, "value": 185, "consensus": False},
    {"ticker": "TATAMOTORS", "schemes": "DSP BlackRock, Mirae Asset", "units": 1500000, "value": 140, "consensus": True},
    {"ticker": "ZOMATO", "schemes": "Motilal Oswal Midcap, Axis Growth", "units": 6200000, "value": 115, "consensus": False},
    {"ticker": "COALINDIA", "schemes": "UTI Dividend Yield, IDFC Sterling", "units": 3400000, "value": 98, "consensus": False},
    {"ticker": "TITAN", "schemes": "Franklin India, Tata Balanced", "units": 240000, "value": 82, "consensus": True},
    {"ticker": "DLF", "schemes": "Canara Robeco, Invesco Contra", "units": 850000, "value": 68, "consensus": False}
]

# Simulated live block trade feed generator
BLOCK_TRADES_POOL = [
    {"ticker": "ZOMATO", "company": "Zomato Limited", "units": 4500000, "price": 182.50, "side": "BUY"},
    {"ticker": "HAL", "company": "Hindustan Aeronautics", "units": 120000, "price": 4210.00, "side": "BUY"},
    {"ticker": "TITAN", "company": "Titan Company Ltd", "units": 85000, "price": 3415.20, "side": "SELL"},
    {"ticker": "RELIANCE", "company": "Reliance Industries", "units": 280000, "price": 2844.00, "side": "BUY"},
    {"ticker": "TRENT", "company": "Trent Limited", "units": 95000, "price": 4950.00, "side": "BUY"},
    {"ticker": "TATASTEEL", "company": "Tata Steel Limited", "units": 3200000, "price": 156.40, "side": "SELL"},
    {"ticker": "INFY", "company": "Infosys Limited", "units": 520000, "price": 1485.00, "side": "BUY"},
    {"ticker": "HDFCBANK", "company": "HDFC Bank Limited", "units": 650000, "price": 1622.50, "side": "SELL"},
    {"ticker": "JIOFIN", "company": "Jio Financial Services", "units": 1800000, "price": 352.10, "side": "BUY"}
]

AUREX_TAKES = [
    "Big money accumulator loading positions near support.",
    "Block exit by institutional investor; expect brief supply overhead.",
    "High conviction block transaction; aligns with sector momentum.",
    "Arbitrage execution block trade; minor volatility indicator.",
    "Strategic promoter block placement; long-term consolidation target."
]

@router.get("/block-trades")
async def sse_block_trades():
    async def sse_generator():
        # Yield first 5 immediately to populate initial UI table
        initial_trades = random.sample(BLOCK_TRADES_POOL, 5)
        for i, trade in enumerate(initial_trades):
            val_cr = round((trade["units"] * trade["price"]) / 10000000, 2)
            time_str = (datetime.now() - timedelta(seconds=(5-i)*60)).strftime("%H:%M:%S")
            item = {
                "time": time_str,
                "ticker": trade["ticker"],
                "company": trade["company"],
                "side": trade["side"],
                "units": trade["units"],
                "value_cr": val_cr,
                "aurex_take": random.choice(AUREX_TAKES)
            }
            yield f"data: {json.dumps(item)}\n\n"
            
        # Stream a new trade trade every 15 seconds
        while True:
            await asyncio.sleep(15)
            trade = random.choice(BLOCK_TRADES_POOL)
            val_cr = round((trade["units"] * trade["price"]) / 10000000, 2)
            time_str = datetime.now().strftime("%H:%M:%S")
            item = {
                "time": time_str,
                "ticker": trade["ticker"],
                "company": trade["company"],
                "side": trade["side"],
                "units": trade["units"] + random.randint(-5000, 5000),
                "value_cr": val_cr,
                "aurex_take": random.choice(AUREX_TAKES)
            }
            yield f"data: {json.dumps(item)}\n\n"
            
    return StreamingResponse(sse_generator(), media_type="text/event-stream")

@router.get("/fii-dii")
async def get_whale_fii_dii():
    # Return last 30 days flows
    res = []
    today = datetime.now()
    for i in range(30):
        d_str = (today - timedelta(days=30-i)).strftime("%Y-%m-%d")
        fii_val = random.randint(-5000, 2000)
        dii_val = random.randint(500, 4800)
        res.append({
            "date": d_str,
            "fii": fii_val,
            "dii": dii_val
        })
    return {
        "flows": res,
        "fii_today": -1840, # mock net flow in Cr
        "dii_today": 2420,
        "fii_5day_total": -14200
    }

@router.get("/insider-trades")
async def get_insider_trades():
    return {"trades": INSIDER_MOVES}

@router.get("/mf-buying")
async def get_mf_buying():
    return {"buying": MF_BUYING}

@router.post("/alerts")
async def create_whale_alert(req: AlertCreateRequest, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    uid = user_id if user_id != "default_user" else req.user_id
    alert = DBWhaleAlert(
        user_id=uid,
        ticker=req.ticker.upper(),
        threshold=req.threshold
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return {"success": True, "alert_id": alert.id}

@router.get("/alerts/{user_id}")
async def get_whale_alerts(user_id: str, auth_user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    if auth_user_id != "default_user" and auth_user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot access another user's alerts")
    alerts = db.query(DBWhaleAlert).filter(DBWhaleAlert.user_id == user_id).all()
    res = []
    for a in alerts:
        res.append({
            "id": a.id,
            "ticker": a.ticker,
            "threshold": a.threshold
        })
    return {"alerts": res}

@router.delete("/alerts/{alert_id}")
async def delete_whale_alert(alert_id: str, user_id: str, auth_user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    uid = auth_user_id if auth_user_id != "default_user" else user_id
    alert = db.query(DBWhaleAlert).filter(DBWhaleAlert.id == alert_id, DBWhaleAlert.user_id == uid).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    db.delete(alert)
    db.commit()
    return {"success": True}
