from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import logging
import json
import random
from datetime import datetime, timedelta

from backend.models.database import get_db, DBXPEvent, DBUserCardCollection, DBDebateVote, DBHolding, DBChatMessage, DBTransaction, DBProfile
from backend.services.gemma_service import gemma_service, gemma_complete
from backend.services.claude_service import claude_service
from backend.services.market_service import market_service
from backend.services.auth_service import get_current_user

router = APIRouter(prefix="/wrapped", tags=["Vibe Wrapped"])
logger = logging.getLogger("wrapped_router")

@router.get("/{user_id}")
async def generate_wrapped(user_id: str, auth_user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    if auth_user_id != "default_user" and auth_user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot access another user's wrapped report")
    # 1. Fetch profile & base archetype context
    profile = db.query(DBProfile).filter(DBProfile.id == user_id).first()
    archetype = profile.risk_archetype if profile else "FOMO Trader"
    
    # 2. Fetch primary counts from DB
    cards_count = db.query(DBUserCardCollection).filter(DBUserCardCollection.user_id == user_id).count()
    debates_count = db.query(DBDebateVote).filter(DBDebateVote.user_id == user_id).count()
    chat_count = db.query(DBChatMessage).filter(DBChatMessage.user_id == user_id).count()
    
    # Count of signal views (from XP events)
    signals_count = db.query(DBXPEvent).filter(
        DBXPEvent.user_id == user_id,
        DBXPEvent.event_type == "signal_read"
    ).count()
    
    # Portfolio checks proxy
    portfolio_checks = max(random.randint(35, 68), chat_count * 2 + signals_count + 5)
    
    # Best and worst holdings
    holdings = db.query(DBHolding).filter(DBHolding.user_id == user_id).all()
    best_holding = {"ticker": "N/A", "return_pct": 0.0}
    worst_holding = {"ticker": "N/A", "return_pct": 0.0}
    total_return = random.uniform(2.5, 12.0)
    
    if holdings:
        performances = []
        for h in holdings:
            try:
                # Try fetching live quote for computation
                quote = await market_service.get_stock_quote(h.ticker)
                curr_price = quote.get("price") or h.avg_buy_price
            except Exception:
                curr_price = h.avg_buy_price * random.uniform(0.85, 1.30)
                
            ret = ((curr_price - h.avg_buy_price) / h.avg_buy_price) * 100
            performances.append({"ticker": h.ticker, "return_pct": round(ret, 2)})
            
        performances.sort(key=lambda x: x["return_pct"])
        if performances:
            worst_holding = performances[0]
            best_holding = performances[-1]
            total_return = sum(p["return_pct"] for p in performances) / len(performances)
    else:
        # Fallbacks for empty portfolio demo
        best_holding = {"ticker": "ZOMATO", "return_pct": 34.20}
        worst_holding = {"ticker": "PAYTM", "return_pct": -14.80}
        total_return = 8.60

    # 3. Dynamic metrics computations (FOMO, HODL, Panic, Savage)
    transactions = db.query(DBTransaction).filter(DBTransaction.user_id == user_id).all()
    total_trades = len(transactions)
    buy_trades = [t for t in transactions if t.side == "BUY"]
    sell_trades = [t for t in transactions if t.side == "SELL"]
    
    # A. FOMO Index
    fomo_trades = 0
    if buy_trades:
        # Fetch signal read events
        signal_reads = db.query(DBXPEvent).filter(
            DBXPEvent.user_id == user_id,
            DBXPEvent.event_type == "signal_read"
        ).all()
        
        for bt in buy_trades:
            # Check if there is any signal read within 10 minutes prior to BUY
            for sr in signal_reads:
                time_diff = (bt.created_at - sr.created_at).total_seconds()
                if 0 <= time_diff <= 600:
                    fomo_trades += 1
                    break
                    
        fomo_ratio = fomo_trades / len(buy_trades)
        fomo_index = int(fomo_ratio * 100)
    else:
        # Fallback based on profile risk archetype
        archetype_fomo = {
            "FOMO Trader": 85,
            "Thrill Chaser": 75,
            "Optimizer": 35,
            "Slow Builder": 15
        }
        fomo_index = archetype_fomo.get(archetype, 50)
        
    # B. HODL Strength
    if buy_trades and not sell_trades:
        hodl_strength = 95  # Holding everything!
    elif buy_trades and sell_trades:
        holding_times = []
        for st in sell_trades:
            # Find matching buy trade before this sell trade
            matching_buys = [bt for bt in buy_trades if bt.ticker == st.ticker and bt.created_at < st.created_at]
            if matching_buys:
                earliest_buy = min(matching_buys, key=lambda x: x.created_at)
                days_diff = (st.created_at - earliest_buy.created_at).total_seconds() / (24 * 3600)
                holding_times.append(days_diff)
                
        if holding_times:
            avg_days = sum(holding_times) / len(holding_times)
            # 30+ days holding = 90+ strength. 1 day or less = 10 strength.
            hodl_strength = min(98, max(8, int(avg_days * 3)))
        else:
            hodl_strength = 70
    else:
        # Fallback based on profile
        archetype_hodl = {
            "Slow Builder": 90,
            "Optimizer": 75,
            "FOMO Trader": 30,
            "Thrill Chaser": 20
        }
        hodl_strength = archetype_hodl.get(archetype, 60)
        
    # C. Panic Factor
    # High checks count and low trades count = high panic!
    panic_factor = min(95, max(12, int((portfolio_checks / (total_trades + 1)) * 4.5)))
    
    # D. Savage Quotient
    savage_quotient = min(98, max(22, int(chat_count * 1.5 + debates_count * 6.5 + 28)))
    
    # VibeScore progress
    total_xp = db.query(func.sum(DBXPEvent.xp_amount)).filter(DBXPEvent.user_id == user_id).scalar() or 0.0
    vibe_score_start = max(0.0, total_xp - 120.0)
    vibe_score_end = total_xp
    
    current_month = datetime.now().strftime("%B")
    
    # 4. Prompt Aurex AI to comment on these specific metrics
    prompt_str = f"""
    User Archetype: {archetype}
    User Portfolio returns this month: {total_return:.2f}%
    Best holding: {best_holding['ticker']} with {best_holding['return_pct']}% return
    Worst holding: {worst_holding['ticker']} with {worst_holding['return_pct']}% return
    Portfolio checks: {portfolio_checks} times
    Signals read: {signals_count}
    Debates voted: {debates_count}
    Trading cards unlocked: {cards_count}
    Total Trades executed: {total_trades} (Buys: {len(buy_trades)}, Sells: {len(sell_trades)})
    
    Computed Behavior Radar Metrics:
    - FOMO Index: {fomo_index}/100
    - HODL Strength: {hodl_strength}/100
    - Panic Factor: {panic_factor}/100
    - Savage Quotient: {savage_quotient}/100
    """
    
    system_prompt = """
    You are Aurex AI, a savage, witty, and deeply honest Gen Z investment coach.
    Based on the user's financial behaviors this month, generate a JSON response with the following keys:
    1. "one_word": One single word in uppercase representing their month (e.g. OVERTHINKER, PAPERHANDS, DEGEN, DIAMONDHANDS, FOMOING).
    2. "card1_desc": A 1-sentence description explaining why they got that word.
    3. "card3_best_insight": A short savage line praising their best position.
    4. "card3_worst_insight": A short savage line calling out/making fun of their worst position.
    5. "card4_behavioral_quote": An honest, 2-sentence breakdown of their portfolio checks and trading discipline.
    6. "card5_mission": A single 12-word call-to-action/mission statement for next month.
    Write in pure JSON. Do not include markdown codeblocks or wrapper text.
    """
    
    try:
        gemma_resp = await gemma_service.completion(
            prompt=f"Generate Wrapped narrative for these stats:\n{prompt_str}",
            system_prompt=system_prompt,
            max_tokens=600
        )
        insights = json.loads(gemma_resp.strip().replace("```json", "").replace("```", ""))
    except Exception as ex:
        logger.error(f"Gemma 4 Vibe Wrapped narrative generation failed: {ex}")
        insights = {
            "one_word": "DEGEN" if fomo_index > 60 else "VOLATILE",
            "card1_desc": "You spent more time checking charts than actually accumulating assets, bestie.",
            "card3_best_insight": f"{best_holding['ticker']} actually printing green signals. We love to see it.",
            "card3_worst_insight": f"{worst_holding['ticker']} is down bad. Major L. Sell or HODL?",
            "card4_behavioral_quote": f"You checked your portfolio {portfolio_checks} times this month. The charts don't move faster just because you're staring.",
            "card5_mission": "Ignore the group chats. Accumulate index funds and chill."
        }
        
    return {
        "success": True,
        "month": current_month,
        "portfolio_checks": portfolio_checks,
        "signals_read": signals_count,
        "debates_won": debates_count,
        "cards_collected": cards_count,
        "vibe_score_start": int(vibe_score_start),
        "vibe_score_end": int(vibe_score_end),
        "total_return_pct": round(total_return, 2),
        "best_holding": best_holding,
        "worst_holding": worst_holding,
        "fomo_index": fomo_index,
        "hodl_strength": hodl_strength,
        "panic_factor": panic_factor,
        "savage_quotient": savage_quotient,
        "one_word": insights.get("one_word", "VOLATILE"),
        "card1_desc": insights.get("card1_desc", "Interesting months ahead."),
        "card3_best_insight": insights.get("card3_best_insight", "Nice win."),
        "card3_worst_insight": insights.get("card3_worst_insight", "Rough entry point."),
        "card4_behavioral_quote": insights.get("card4_behavioral_quote", "Stay disciplined, market has cycles."),
        "card5_mission": insights.get("card5_mission", "Stay calm and DCA.")
    }
