from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.orm import Session
import logging
import numpy as np
import json
from typing import List, Dict, Any

from backend.models.database import get_db, DBHolding
from backend.services.market_service import market_service
from backend.services.gemma_service import gemma_service
from backend.services.claude_service import claude_service
from backend.services.auth_service import get_current_user

router = APIRouter(prefix="/forecaster", tags=["Monte Carlo Wealth Forecaster"])
logger = logging.getLogger("forecaster_router")

@router.get("/monte-carlo")
async def run_monte_carlo(
    initial_capital: float = Query(10000.0, description="Starting capital in INR"),
    monthly_sip: float = Query(1000.0, description="Monthly SIP contribution in INR"),
    years: int = Query(5, ge=1, le=10, description="Simulation duration in years"),
    target_goal: float = Query(500000.0, description="Target wealth goal in INR"),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Run 1,000 Geometric Brownian Motion (GBM) simulations to project portfolio value."""
    try:
        # 1. Fetch portfolio stats to estimate mu & sigma
        holdings = db.query(DBHolding).filter(DBHolding.user_id == user_id).all()
        mu = 0.14  # Default 14% mean return
        sigma = 0.18  # Default 18% volatility
        
        if holdings:
            holdings_list = [{"ticker": h.ticker, "quantity": h.quantity, "avg_buy_price": h.avg_buy_price} for h in holdings]
            stats = await market_service.get_portfolio_stats(holdings_list)
            # Volatility from stats is annualized in percent (e.g. 18.5)
            sigma = max(0.08, float(stats.get("volatility", 18.0) / 100.0))
            # Estimate mean return based on Sharpe ratio and risk-free rate of 7%
            sharpe = stats.get("sharpe", 0.5)
            mu = 0.07 + (sharpe * sigma)
            # Constrain to realistic bands
            mu = min(0.35, max(0.06, mu))
            
        # 2. Setup simulation parameters
        num_simulations = 1000
        trading_days = years * 252
        dt = 1 / 252
        
        # We simulate daily steps
        # Matrix to hold simulated values (1000 simulations x trading_days)
        paths = np.zeros((num_simulations, trading_days))
        paths[:, 0] = initial_capital
        
        # Weekly/Monthly increments logic
        # For simplicity, we add monthly SIP on every 21st trading day
        for t in range(1, trading_days):
            # Random shock vector for all simulations
            Z = np.random.normal(0, 1, num_simulations)
            # GBM drift & diffusion
            paths[:, t] = paths[:, t-1] * np.exp((mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * Z)
            
            # Monthly SIP addition
            if t % 21 == 0:
                paths[:, t] += monthly_sip
                
        # 3. Calculate percentiles (10th, 50th, 90th) at each daily step
        percentile_10 = np.percentile(paths, 10, axis=0)
        percentile_50 = np.percentile(paths, 50, axis=0)
        percentile_90 = np.percentile(paths, 90, axis=0)
        
        # Calculate probability of reaching the goal
        final_values = paths[:, -1]
        success_runs = np.sum(final_values >= target_goal)
        success_probability = round(float(success_runs / num_simulations) * 100, 2)
        
        # Calculate total cash invested
        total_invested = initial_capital + (monthly_sip * (years * 12))
        
        # 4. Downsample paths to 50 points for chart speed
        step = max(1, trading_days // 50)
        chart_data = []
        for t in range(0, trading_days, step):
            chart_data.append({
                "day": t,
                "year": round(t / 252, 2),
                "worst_case": round(float(percentile_10[t]), 2),
                "median_case": round(float(percentile_50[t]), 2),
                "best_case": round(float(percentile_90[t]), 2)
            })
            
        # Append the final day always
        if (trading_days - 1) % step != 0:
            chart_data.append({
                "day": trading_days - 1,
                "year": float(years),
                "worst_case": round(float(percentile_10[-1]), 2),
                "median_case": round(float(percentile_50[-1]), 2),
                "best_case": round(float(percentile_90[-1]), 2)
            })
            
        # 5. Get Aurex AI roast summary based on success rate
        prompt = f"""
        Simulation Details:
        - Initial capital: ₹{initial_capital:,.2f}
        - Monthly SIP: ₹{monthly_sip:,.2f}
        - Timeline: {years} years
        - Total Cash Invested: ₹{total_invested:,.2f}
        - Target Wealth Goal: ₹{target_goal:,.2f}
        - Success Probability: {success_probability}%
        - Median Projected Wealth: ₹{percentile_50[-1]:,.2f}
        - Best Projected Wealth: ₹{percentile_90[-1]:,.2f}
        - Worst Projected Wealth: ₹{percentile_10[-1]:,.2f}
        """
        
        system_prompt = "You are Gemma 4 Quant & Wealth Agent. Roast or flex their chance of hitting their goal in 2 punchy sentences. Reply ONLY in JSON: {\"roast\": \"text\"}"
        
        try:
            gemma_resp = await gemma_service.completion(prompt, system_prompt=system_prompt)
            insights = json.loads(gemma_resp.strip().replace("```json", "").replace("```", ""))
            roast = insights.get("roast", "Gemma 4 Quant engine projects high probability with disciplined SIP contributions.")
        except Exception:
            roast = f"You have a {success_probability}% chance of reaching ₹{target_goal:,.2f}. Honestly, staring at charts won't compound your money faster, bestie. Pump that SIP!"
            
        return {
            "success": True,
            "mu": round(mu * 100, 2),
            "sigma": round(sigma * 100, 2),
            "success_probability": success_probability,
            "total_invested": round(total_invested, 2),
            "projected_median": round(float(percentile_50[-1]), 2),
            "projected_best": round(float(percentile_90[-1]), 2),
            "projected_worst": round(float(percentile_10[-1]), 2),
            "roast": roast,
            "chart_data": chart_data
        }
    except Exception as e:
        logger.error(f"Monte Carlo simulation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
