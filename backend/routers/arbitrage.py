from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
import logging
import random
from typing import List, Dict, Any
from datetime import datetime

from backend.models.database import get_db, DBXPEvent, DBProfile
from backend.services.market_service import market_service
from backend.services.auth_service import get_current_user

router = APIRouter(prefix="/arbitrage", tags=["Arbitrage Scanner"])
logger = logging.getLogger("arbitrage_router")

# List of tickers to scan for arbitrage
ARBITRAGE_TICKERS = ["ZOMATO", "TITAN", "RELIANCE", "TATASTEEL", "HAL", "INFY", "TCS", "HDFCBANK"]

@router.get("/live")
async def scan_arbitrage():
    """Scrape and compare stock prices between NSE and BSE, calculating spreads and transaction charges."""
    results = []
    
    for ticker in ARBITRAGE_TICKERS:
        try:
            # Get NSE price
            nse_quote = await market_service.get_stock_quote(f"{ticker}.NS")
            nse_price = nse_quote.get("price", 0.0)
            
            # Get BSE price (simulated percentage spread variance off NSE)
            pct_variance = random.choice([-0.005, -0.002, 0.0035, 0.0055, 0.0075])
            variance = round(nse_price * pct_variance, 2)
            bse_price = round(nse_price + variance, 2)
            
            spread = round(abs(nse_price - bse_price), 2)
            spread_pct = round((spread / min(nse_price, bse_price)) * 100, 3)
            
            buy_exchange = "NSE" if nse_price < bse_price else "BSE"
            sell_exchange = "BSE" if nse_price < bse_price else "NSE"
            
            # Transaction fees estimation (STT 0.1%, Brokerage, GST, exchange charges)
            trade_value = 1000000.0  # ₹10,00,000 flash loan capital
            qty = int(trade_value / min(nse_price, bse_price))
            actual_value = qty * min(nse_price, bse_price)
            
            # Buy Charges (delivery)
            buy_stt = actual_value * 0.001
            buy_stamp = actual_value * 0.00015
            buy_brokerage = min(20.0, actual_value * 0.0005)
            buy_exchange_fees = actual_value * 0.0000345
            buy_gst = (buy_brokerage + buy_exchange_fees) * 0.18
            total_buy_charges = buy_stt + buy_stamp + buy_brokerage + buy_exchange_fees + buy_gst
            
            # Sell Charges (delivery)
            sell_stt = (qty * max(nse_price, bse_price)) * 0.001
            sell_brokerage = min(20.0, (qty * max(nse_price, bse_price)) * 0.0005)
            sell_exchange_fees = (qty * max(nse_price, bse_price)) * 0.0000345
            sell_gst = (sell_brokerage + sell_exchange_fees) * 0.18
            total_sell_charges = sell_stt + sell_brokerage + sell_exchange_fees + sell_gst
            
            total_charges = round(total_buy_charges + total_sell_charges, 2)
            gross_profit = round(qty * spread, 2)
            net_profit = round(gross_profit - total_charges - (trade_value * 0.0005), 2) # deducting 0.05% flash loan fee
            
            results.append({
                "ticker": ticker,
                "nse_price": nse_price,
                "bse_price": bse_price,
                "spread": spread,
                "spread_percentage": spread_pct,
                "buy_exchange": buy_exchange,
                "sell_exchange": sell_exchange,
                "gross_profit": gross_profit,
                "estimated_charges": total_charges,
                "net_profit": net_profit,
                "is_profitable": net_profit > 0
            })
        except Exception as e:
            logger.error(f"Failed to scan arbitrage for {ticker}: {e}")
            
    return results

@router.post("/execute")
async def execute_flash_loan(
    ticker: str = Query(..., description="Ticker to arbitrage"),
    amount: float = Query(1000000.0, description="Flash loan size in INR"),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Simulate a step-by-step smart contract flash loan arbitrage execution."""
    ticker = ticker.upper()
    try:
        # Fetch current price spread using the standard .NS suffix
        symbol = ticker if ticker.endswith(".NS") or ticker.endswith(".BO") else f"{ticker}.NS"
        nse_quote = await market_service.get_stock_quote(symbol)
        nse_price = nse_quote.get("price", 150.00)
        
        # Ensure it is profitable in execution by picking a positive percentage variance (e.g. 0.45% to 0.75%)
        pct_var = random.uniform(0.0045, 0.0075)
        bse_price = round(nse_price * (1.0 + pct_var), 2)
        
        buy_price = nse_price
        sell_price = bse_price
        
        qty = int(amount / buy_price)
        loan_fee = round(amount * 0.0005, 2) # 0.05% pool fee
        
        # EVM-like step logs
        logs = [
            f"[0x00] ─── INITIALIZING FLASH LOAN ARBITRAGE FOR {ticker} ───",
            f"[0x01] Querying pool reserves... Available Liquidity: ₹1,50,00,000 INR",
            f"[0x02] Requesting flash loan of ₹{amount:,.2f} from Aave Liquidity Pool...",
            f"[0x03] [SUCCESS] Received ₹{amount:,.2f} (Txn: 0x9f3a...d3e2). Fee: ₹{loan_fee:,.2f}",
            f"[0x04] Routing buy order on NSE for {qty:,} shares at ₹{buy_price:,.2f}...",
            f"[0x05] [SUCCESS] Buy order filled on NSE. Total Cost: ₹{qty*buy_price:,.2f}",
            f"[0x06] Calculating delivery fees: STT=₹{qty*buy_price*0.001:,.2f}, Stamp=₹{qty*buy_price*0.00015:,.2f}, GST=₹5.40",
            f"[0x07] Transferring {qty:,} shares of {ticker} to BSE deposit pool...",
            f"[0x08] Routing sell order on BSE for {qty:,} shares at ₹{sell_price:,.2f}...",
            f"[0x09] [SUCCESS] Sell order filled on BSE. Gross Proceeds: ₹{qty*sell_price:,.2f}",
            f"[0x0A] Calculating sell transaction fees: STT=₹{qty*sell_price*0.001:,.2f}, GST=₹4.80",
            f"[0x0B] Repaying loan principal of ₹{amount:,.2f} + fee of ₹{loan_fee:,.2f} back to Aave Pool...",
            f"[0x0C] [SUCCESS] Aave loan repaid in full. Transaction validated in block #17893202.",
        ]
        
        gross_profit = qty * (sell_price - buy_price)
        total_charges = (qty * buy_price * 0.00115) + (qty * sell_price * 0.00105) + 15.00
        net_profit = round(gross_profit - total_charges - loan_fee, 2)
        
        if net_profit > 0:
            logs.append(f"[0x0D] [PROFIT CAPTURED] Net profit of ₹{net_profit:,.2f} credited to user wallet. No cap! 🚀")
            # Award +35 XP for running successful arbitrage
            event = DBXPEvent(user_id=user_id, event_type="arbitrage_run", xp_amount=35.0)
            db.add(event)
            
            # Credit cash balance in profile (create profile if not exists)
            profile = db.query(DBProfile).filter(DBProfile.id == user_id).first()
            if not profile:
                profile = DBProfile(id=user_id, cash_balance=1000000.0)
                db.add(profile)
            profile.cash_balance += net_profit
                
            db.commit()
        else:
            logs.append(f"[0x0D] [TRANSACTION REVERTED] Arbitrage unprofitable after fees. Reverting state changes to protect principal. 🛑")
            
        return {
            "success": True,
            "ticker": ticker,
            "net_profit": net_profit,
            "logs": logs
        }
    except Exception as e:
        logger.error(f"Flash loan simulation failed for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel

class BacktestRequest(BaseModel):
    min_spread: float = 0.25 # in %
    slippage_tolerance: float = 0.05 # in %
    pool_size: float = 1000000.0 # in INR
    gas_limit: int = 150000
    user_id: str = "default_user"

@router.post("/backtest")
async def run_arbitrage_backtest(req: BacktestRequest, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Run a 30-day historical HFT arbitrage backtest with custom parameters."""
    try:
        # Override request body user_id if authenticated, or use it if not
        uid = user_id if user_id != "default_user" else req.user_id
        import random
        daily_results = []
        total_trades = 0
        profitable_trades = 0
        reverted_count = 0
        total_profit = 0.0
        total_gas_cost = 0.0
        
        gas_price_inr = 0.15 # flat rate in INR per gas unit
        
        for day in range(1, 31):
            opportunities = random.randint(5, 15)
            day_trades = 0
            day_profitable = 0
            day_reverted = 0
            day_pnl = 0.0
            day_gas = 0.0
            
            for _ in range(opportunities):
                spread_pct = random.uniform(0.05, 0.85)
                trade_gas = req.gas_limit * gas_price_inr * random.uniform(0.85, 1.25)
                day_gas += trade_gas
                
                if spread_pct >= req.min_spread:
                    slippage = random.uniform(0.01, 0.15)
                    if slippage <= req.slippage_tolerance:
                        day_trades += 1
                        gross_yield = req.pool_size * (spread_pct / 100.0)
                        charges = (req.pool_size * 0.0015) + (req.pool_size * 0.0005) + trade_gas
                        net_yield = gross_yield - charges
                        
                        if net_yield > 0:
                            day_profitable += 1
                            day_pnl += net_yield
                        else:
                            day_pnl += net_yield
                    else:
                        day_reverted += 1
                        day_pnl -= trade_gas
                
            total_trades += day_trades
            profitable_trades += day_profitable
            reverted_count += day_reverted
            total_profit += day_pnl
            total_gas_cost += day_gas
            
            daily_results.append({
                "day": day,
                "trades": day_trades,
                "profitable": day_profitable,
                "reverted": day_reverted,
                "pnl": round(day_pnl, 2),
                "gas": round(day_gas, 2)
            })
            
        win_rate = (profitable_trades / total_trades * 100) if total_trades > 0 else 0.0
        
        if req.slippage_tolerance < 0.03:
            roast = f"Slippage tolerance at {req.slippage_tolerance}% is too tight, my friend! MEV frontrunners ate your gas for breakfast while your trades reverted. 😭"
        elif req.min_spread > 0.6:
            roast = f"A spread limit of {req.min_spread}%? You're waiting for a miracle. In high-frequency trading, spreads this big last for milliseconds. Lower it to catch actual volume. 🤡"
        elif total_profit < 0:
            roast = f"Wiped out. Total net losses of ₹{abs(total_profit):,.2f} due to excessive gas fees and loan charges. Aave liquidity providers thank you for your donation. 💀"
        else:
            roast = f"Honestly not bad. ₹{total_profit:,.2f} net profit. You managed to dodge the MEV sandwich bots. Go buy yourself a cold brew! ☕"
            
        event = DBXPEvent(user_id=uid, event_type="arbitrage_backtest", xp_amount=50.0)
        db.add(event)
        
        if total_profit > 0:
            profile = db.query(DBProfile).filter(DBProfile.id == uid).first()
            if not profile:
                profile = DBProfile(id=uid, cash_balance=1000000.0)
                db.add(profile)
            profile.cash_balance += total_profit
            
        db.commit()
        
        return {
            "success": True,
            "total_trades": total_trades,
            "win_rate": round(win_rate, 2),
            "net_profit": round(total_profit, 2),
            "gas_burned": round(total_gas_cost, 2),
            "reverted_count": reverted_count,
            "daily_history": daily_results,
            "slippage_roast": roast
        }
    except Exception as e:
        logger.error(f"Backtest simulation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
