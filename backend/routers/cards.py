from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any
import logging

from backend.models.database import get_db, DBUserCardCollection, DBNotification, DBXPEvent
from backend.services.auth_service import get_current_user

router = APIRouter(prefix="/cards", tags=["Trading Cards"])
logger = logging.getLogger("cards_router")

# Define 50 preset stock cards representing Nifty 50 and popular Gen Z tickers
SECTORS = {
    "IT": "#7c3aed",       # Purple
    "Finance": "#00d09c",  # Green
    "Auto": "#ffb690",     # Orange
    "Pharma": "#fecdd3",   # Rose
    "FMCG": "#fd56a7",     # Pink
    "Energy": "#fde047",   # Yellow
    "Metals": "#bbf7d0",   # Emerald
    "Realty": "#7dd3fc",   # Cyan
    "Infra": "#eaddff",    # Violet
    "Consumer": "#a78bfa", # Lavender
    "Media": "#f97316"     # Orange-dark
}

STOCK_CARDS = [
    {
        "ticker": "ZOMATO",
        "name": "Zomato Limited",
        "fun_name": "Late Night Munchies Savior",
        "sector": "Consumer",
        "rarity": "Rare",
        "volatility": 65,
        "momentum": 88,
        "fundamentals": 60,
        "vibe": 95,
        "description": "Fueling 2 AM biryani cravings and impulse dessert orders across the nation. High calorie, high volatility, total vibe.",
        "fun_fact": "Their delivery partners have driven enough kilometers to reach Mars and back!",
        "emoji": "🍟"
    },
    {
        "ticker": "TITAN",
        "name": "Titan Company Limited",
        "fun_name": "Bling & Big Fat Weddings",
        "sector": "Consumer",
        "rarity": "Legendary",
        "volatility": 20,
        "momentum": 65,
        "fundamentals": 95,
        "vibe": 92,
        "description": "Selling gold watches and wedding jewelry. When Indian weddings happen, Titan wins. The ultimate wealth flex.",
        "fun_fact": "Rakesh Jhunjhunwala's crown jewel. It's basically a luxury trust fund disguised as a watch store.",
        "emoji": "💎"
    },
    {
        "ticker": "RELIANCE",
        "name": "Reliance Industries Limited",
        "fun_name": "The Motherboard of India",
        "sector": "Energy",
        "rarity": "Legendary",
        "volatility": 15,
        "momentum": 50,
        "fundamentals": 98,
        "vibe": 94,
        "description": "From crude oil to cheap data plans, Ambani's behemoth is the invisible hand behind every Indian's daily routine.",
        "fun_fact": "If Jio goes down for 1 hour, India's internet memes consumption drops by 90%.",
        "emoji": "🛢️"
    },
    {
        "ticker": "INFY",
        "name": "Infosys Limited",
        "fun_name": "The Cubicle Overlords",
        "sector": "IT",
        "rarity": "Rare",
        "volatility": 28,
        "momentum": 45,
        "fundamentals": 90,
        "vibe": 70,
        "description": "The classic IT giant. Helping global companies migrate to the cloud while training freshers in Mysore campus.",
        "fun_fact": "Their Mysore campus looks more like a resort than a software company.",
        "emoji": "💻"
    },
    {
        "ticker": "TCS",
        "name": "Tata Consultancy Services",
        "fun_name": "Global Service Giants",
        "sector": "IT",
        "rarity": "Rare",
        "volatility": 22,
        "momentum": 40,
        "fundamentals": 95,
        "vibe": 68,
        "description": "The absolute titan of IT service exports. If your printer doesn't work in New York, TCS probably fixes it.",
        "fun_fact": "Employs more people than some small European countries have citizens.",
        "emoji": "🏢"
    },
    {
        "ticker": "PAYTM",
        "name": "One97 Communications",
        "fun_name": "Soundbox Subscription Lord",
        "sector": "Finance",
        "rarity": "Epic",
        "volatility": 85,
        "momentum": 30,
        "fundamentals": 40,
        "vibe": 60,
        "description": "Pioneered mobile payments in India. Now making money selling those cute little soundboxes to shopkeepers.",
        "fun_fact": "That signature chime 'Paytm par 20 rupees prapt hue' is the unofficial background score of Indian street food.",
        "emoji": "📱"
    },
    {
        "ticker": "HAL",
        "name": "Hindustan Aeronautics Limited",
        "fun_name": "Jet Fighter Factory",
        "sector": "Infra",
        "rarity": "Epic",
        "volatility": 45,
        "momentum": 90,
        "fundamentals": 88,
        "vibe": 92,
        "description": "Building fighter aircraft, helicopters, and aerospace structures for national defense. Literal sky-high gains.",
        "fun_fact": "They make the Tejas fighter jet, which is faster than your internet provider's response time.",
        "emoji": "✈️"
    },
    {
        "ticker": "HDFCBANK",
        "name": "HDFC Bank Limited",
        "fun_name": "The Vault of India",
        "sector": "Finance",
        "rarity": "Legendary",
        "volatility": 18,
        "momentum": 42,
        "fundamentals": 98,
        "vibe": 85,
        "description": "The safest bank in the land. Its balance sheet is so clean you could eat off it. Safe, solid, and slightly boring.",
        "fun_fact": "They have a branch in almost every corner of India, probably even in your dreams.",
        "emoji": "🏦"
    },
    {
        "ticker": "ICICIBANK",
        "name": "ICICI Bank Limited",
        "fun_name": "Aggressive Loan Sellers",
        "sector": "Finance",
        "rarity": "Rare",
        "volatility": 22,
        "momentum": 58,
        "fundamentals": 92,
        "vibe": 80,
        "description": "Sleek, digital-first banking with a massive credit card footprint and slightly aggressive sales calls.",
        "fun_fact": "You will get an ICICI credit card pre-approved offer before you get your college degree.",
        "emoji": "💳"
    },
    {
        "ticker": "ITC",
        "name": "ITC Limited",
        "fun_name": "Smokes & Aashirvaad Atta",
        "sector": "FMCG",
        "rarity": "Legendary",
        "volatility": 15,
        "momentum": 70,
        "fundamentals": 96,
        "vibe": 95,
        "description": "The ultimate defensive stock. Providing cigarettes to the nation while simultaneously selling cookies and wheat flour.",
        "fun_fact": "The meme community's favorite stock because it traded at exactly 200 rupees for what felt like a decade.",
        "emoji": "🚬"
    },
    {
        "ticker": "SBIN",
        "name": "State Bank of India",
        "fun_name": "Lunch Break Pioneers",
        "sector": "Finance",
        "rarity": "Common",
        "volatility": 32,
        "momentum": 55,
        "fundamentals": 82,
        "vibe": 65,
        "description": "The giant public sector bank. If you want to experience vintage bureaucracy or deposit old cash, this is the place.",
        "fun_fact": "Famously known for the 'Please come after lunch' response, which is a national legacy.",
        "emoji": "🥪"
    },
    {
        "ticker": "BHARTIARTL",
        "name": "Bharti Airtel Limited",
        "fun_name": "Network Tower Flexer",
        "sector": "Media",
        "rarity": "Rare",
        "volatility": 28,
        "momentum": 62,
        "fundamentals": 88,
        "vibe": 78,
        "description": "Premium telecom provider targeting high-paying data users. Constantly fighting Jio for digital dominance.",
        "fun_fact": "Their 5G speeds can download a movie in 2 seconds, but only if you stand next to a specific tree.",
        "emoji": "📶"
    },
    {
        "ticker": "LTIM",
        "name": "LTIMindtree Limited",
        "fun_name": "Mid-Cap Software Ninjas",
        "sector": "IT",
        "rarity": "Epic",
        "volatility": 42,
        "momentum": 58,
        "fundamentals": 84,
        "vibe": 75,
        "description": "Born from the merger of L&T Infotech and Mindtree. High growth, fast execution, fighting the legacy big players.",
        "fun_fact": "They prove that mid-tier IT can have more juice and growth than the grandfather stocks.",
        "emoji": "💻"
    },
    {
        "ticker": "MARUTI",
        "name": "Maruti Suzuki India",
        "fun_name": "Middle Class Dream Machine",
        "sector": "Auto",
        "rarity": "Rare",
        "volatility": 25,
        "momentum": 50,
        "fundamentals": 90,
        "vibe": 72,
        "description": "Making the cars that represent 50% of the vehicles on Indian roads. Practical, efficient, and holds resale value like gold.",
        "fun_fact": "Almost every Indian learned how to drive in an Alto or a Swift.",
        "emoji": "🚗"
    },
    {
        "ticker": "TATACHEM",
        "name": "Tata Chemicals Limited",
        "fun_name": "Salt of the Nation",
        "sector": "Metals",
        "rarity": "Common",
        "volatility": 30,
        "momentum": 45,
        "fundamentals": 85,
        "vibe": 68,
        "description": "Producing soda ash and salt. If you have eaten salt in India, you've probably eaten Tata Salt.",
        "fun_fact": "Their brand slogan 'Desh Ka Namak' (Salt of the Nation) is a literal truth.",
        "emoji": "🧂"
    },
    {
        "ticker": "JIOFIN",
        "name": "Jio Financial Services",
        "fun_name": "Ambani's Fintech Shield",
        "sector": "Finance",
        "rarity": "Epic",
        "volatility": 50,
        "momentum": 80,
        "fundamentals": 75,
        "vibe": 90,
        "description": "The newly spun-off fintech arm of Reliance. Massive potential backing, aiming to disrupt standard banking players.",
        "fun_fact": "It was listed without any operating revenue and still became one of the largest companies instantly.",
        "emoji": "💰"
    },
    {
        "ticker": "IREDA",
        "name": "Indian Renewable Energy Dev",
        "fun_name": "Green Money Printer",
        "sector": "Energy",
        "rarity": "Epic",
        "volatility": 75,
        "momentum": 92,
        "fundamentals": 70,
        "vibe": 96,
        "description": "Financing solar, wind, and hydro projects. Riding the massive renewable energy transition wave of India.",
        "fun_fact": "Rallied over 400% after its IPO because green energy is the ultimate hype train.",
        "emoji": "☀️"
    },
    {
        "ticker": "RVNL",
        "name": "Rail Vikas Nigam Limited",
        "fun_name": "Train Track Laying Champ",
        "sector": "Infra",
        "rarity": "Epic",
        "volatility": 60,
        "momentum": 85,
        "fundamentals": 72,
        "vibe": 88,
        "description": "Building railway tracks, tunnels, and metro lines. Heavy government backing and a massive order book.",
        "fun_fact": "The order book is so long it can literally wrap around the globe three times.",
        "emoji": "🚂"
    },
    {
        "ticker": "TATAMOTORS",
        "name": "Tata Motors Limited",
        "fun_name": "EV Revolution Driver",
        "sector": "Auto",
        "rarity": "Epic",
        "volatility": 40,
        "momentum": 82,
        "fundamentals": 85,
        "vibe": 94,
        "description": "Dominating the Indian electric car market with Nexon EV while turning around Jaguar Land Rover globally.",
        "fun_fact": "They turned Nexon from a boring SUV to the cool EV that everyone wants in their driveway.",
        "emoji": "⚡"
    },
    {
        "ticker": "DLF",
        "name": "DLF Limited",
        "fun_name": "Gurgaon Skyline Architects",
        "sector": "Realty",
        "rarity": "Rare",
        "volatility": 45,
        "momentum": 75,
        "fundamentals": 80,
        "vibe": 82,
        "description": "Built Gurgaon from a farmland to a cyber hub. High-end luxury apartments selling out in minutes.",
        "fun_fact": "They sold luxury apartments worth 7,000 crores in just 72 hours. High society flex.",
        "emoji": "🏢"
    },
    {
        "ticker": "ASIANPAINT",
        "name": "Asian Paints Limited",
        "fun_name": "Diwali Wall Makeovers",
        "sector": "Consumer",
        "rarity": "Rare",
        "volatility": 18,
        "momentum": 40,
        "fundamentals": 94,
        "vibe": 74,
        "description": "Monopolizing the paint industry. If someone repaints their house before Diwali, Asian Paints gets paid.",
        "fun_fact": "Their supply chain is so advanced they predict which color you'll buy before you even know it.",
        "emoji": "🎨"
    },
    {
        "ticker": "ZEEL",
        "name": "Zee Entertainment Enterprises",
        "fun_name": "Soap Opera Drama Hub",
        "sector": "Media",
        "rarity": "Common",
        "volatility": 92,
        "momentum": 20,
        "fundamentals": 40,
        "vibe": 45,
        "description": "Broadcasting daily dramas and soap operas to millions of households. High volatility, high corporate drama.",
        "fun_fact": "The corporate boardroom drama is often more dramatic than the shows they broadcast.",
        "emoji": "📺"
    },
    {
        "ticker": "TATAPOWER",
        "name": "Tata Power Company",
        "fun_name": "Electrifying the Future",
        "sector": "Energy",
        "rarity": "Rare",
        "volatility": 35,
        "momentum": 70,
        "fundamentals": 82,
        "vibe": 86,
        "description": "Setting up EV charging stations, solar rooftops, and traditional power generation. Powering modern India.",
        "fun_fact": "Building the highway charging network so your EV doesn't run out of juice mid-trip.",
        "emoji": "⚡"
    },
    {
        "ticker": "ADANIPORTS",
        "name": "Adani Ports & SEZ",
        "fun_name": "The Cargo Gatekeepers",
        "sector": "Infra",
        "rarity": "Rare",
        "volatility": 42,
        "momentum": 75,
        "fundamentals": 80,
        "vibe": 80,
        "description": "Operating India's largest private ports. Standard monopoly on maritime trade. Huge cash flows.",
        "fun_fact": "They manage more cargo containers than you have unread emails.",
        "emoji": "⚓"
    },
    {
        "ticker": "TRENT",
        "name": "Trent Limited (Tata Retail)",
        "fun_name": "Westside Hype Beast",
        "sector": "Consumer",
        "rarity": "Epic",
        "volatility": 48,
        "momentum": 96,
        "fundamentals": 86,
        "vibe": 98,
        "description": "Tata's retail jewel behind Westside and Zudio. Fast fashion that's affordable, trendy, and wildly profitable.",
        "fun_fact": "Zudio stores are always crowded because you can get an entire outfit for the price of a coffee.",
        "emoji": "👗"
    }
]

# Truncate stock cards list to precisely 25 cards
STOCK_CARDS = STOCK_CARDS[:25]

class UnlockRequest(BaseModel):
    user_id: str
    ticker: str
    trigger: str

@router.post("/unlock")
async def unlock_card(req: UnlockRequest, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    ticker = req.ticker.upper().split(".")[0].strip()
    uid = user_id if user_id != "default_user" else req.user_id
    
    # Check if card exists in predefined list
    card_found = None
    for c in STOCK_CARDS:
        if c["ticker"] == ticker:
            card_found = c
            break
            
    if not card_found:
        raise HTTPException(status_code=404, detail=f"Card for ticker {ticker} not found in database.")
        
    # Check if user already unlocked this card
    existing = db.query(DBUserCardCollection).filter(
        DBUserCardCollection.user_id == uid,
        DBUserCardCollection.ticker == ticker
    ).first()
    
    is_new = False
    if not existing:
        is_new = True
        
    new_card = DBUserCardCollection(
        user_id=uid,
        ticker=ticker,
        is_staked=False
    )
    db.add(new_card)
    
    # Award +20 XP
    xp_event = DBXPEvent(
        user_id=uid,
        event_type="card_unlocked",
        xp_amount=20.0
    )
    db.add(xp_event)
    
    # Send Notification
    notif = DBNotification(
        user_id=uid,
        type="card_unlocked",
        message=f"Unlocked Stock Card: {ticker} ({card_found['rarity']})! +20 XP 🎴"
    )
    db.add(notif)
    db.commit()
        
    # Compute full card data
    card_data = {
        **card_found,
        "sector_color": SECTORS.get(card_found["sector"], "#9ca3af"),
        "is_collected": True
    }
    
    return {
        "success": True,
        "is_new": is_new,
        "card": card_data
    }

@router.get("/collection/{user_id}")
async def get_collection(user_id: str, auth_user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    if auth_user_id != "default_user" and auth_user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot access another user's collection")
    collected = db.query(DBUserCardCollection).filter(DBUserCardCollection.user_id == user_id).all()
    
    counts = {}
    staked_counts = {}
    for c in collected:
        ticker = c.ticker.upper()
        counts[ticker] = counts.get(ticker, 0) + 1
        if getattr(c, 'is_staked', False):
            staked_counts[ticker] = staked_counts.get(ticker, 0) + 1
            
    res_cards = []
    for c in STOCK_CARDS:
        ticker = c["ticker"].upper()
        owned_count = counts.get(ticker, 0)
        staked_count = staked_counts.get(ticker, 0)
        is_collected = owned_count > 0
        is_staked = staked_count > 0
        
        res_cards.append({
            **c,
            "sector_color": SECTORS.get(c["sector"], "#9ca3af"),
            "is_collected": is_collected,
            "owned_count": owned_count,
            "staked_count": staked_count,
            "is_staked": is_staked
        })
        
    return {
        "user_id": user_id,
        "discovered_count": len(counts),
        "total_count": len(STOCK_CARDS),
        "cards": res_cards
    }

class FuseRequest(BaseModel):
    user_id: str
    ticker: str

class StakeRequest(BaseModel):
    user_id: str
    ticker: str

@router.post("/fuse")
async def fuse_cards(req: FuseRequest, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    ticker = req.ticker.upper().split(".")[0].strip()
    uid = user_id if user_id != "default_user" else req.user_id
    
    card_found = None
    for c in STOCK_CARDS:
        if c["ticker"] == ticker:
            card_found = c
            break
    if not card_found:
        raise HTTPException(status_code=404, detail=f"Card for ticker {ticker} not found.")
        
    copies = db.query(DBUserCardCollection).filter(
        DBUserCardCollection.user_id == uid,
        DBUserCardCollection.ticker == ticker,
        DBUserCardCollection.is_staked == False
    ).all()
    
    if len(copies) < 3:
        raise HTTPException(
            status_code=400, 
            detail=f"You need at least 3 unstaked copies of {ticker} to fuse. Found {len(copies)}."
        )
        
    for i in range(3):
        db.delete(copies[i])
        
    rarity = card_found["rarity"]
    next_rarity = "Rare"
    if rarity == "Common":
        next_rarity = "Rare"
    elif rarity == "Rare":
        next_rarity = "Epic"
    elif rarity == "Epic":
        next_rarity = "Legendary"
    elif rarity == "Legendary":
        next_rarity = "Legendary"
        
    pool = [c for c in STOCK_CARDS if c["rarity"] == next_rarity]
    if not pool:
        pool = [c for c in STOCK_CARDS if c["rarity"] == "Rare"]
        
    import random
    new_card_template = random.choice(pool)
    new_ticker = new_card_template["ticker"]
    
    new_card = DBUserCardCollection(
        user_id=uid,
        ticker=new_ticker,
        is_staked=False
    )
    db.add(new_card)
    
    notif = DBNotification(
        user_id=uid,
        type="card_unlocked",
        message=f"🔬 Fusion Lab Success! Burned 3 {ticker} cards to fuse a random {next_rarity} card: {new_ticker}! +40 XP"
    )
    db.add(notif)
    
    xp_event = DBXPEvent(
        user_id=uid,
        event_type="card_fused",
        xp_amount=40.0
    )
    db.add(xp_event)
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Successfully fused 3 {ticker} into 1 {new_ticker}!",
        "card": {
            **new_card_template,
            "sector_color": SECTORS.get(new_card_template["sector"], "#9ca3af"),
            "is_collected": True,
            "owned_count": 1,
            "is_staked": False
        }
    }

@router.post("/stake")
async def stake_card(req: StakeRequest, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    ticker = req.ticker.upper().strip()
    uid = user_id if user_id != "default_user" else req.user_id
    
    card = db.query(DBUserCardCollection).filter(
        DBUserCardCollection.user_id == uid,
        DBUserCardCollection.ticker == ticker,
        DBUserCardCollection.is_staked == False
    ).first()
    
    if not card:
        raise HTTPException(status_code=400, detail=f"No unstaked copies of {ticker} found in your collection.")
        
    card.is_staked = True
    db.commit()
    
    return {"success": True, "message": f"Staked {ticker} successfully in Portfolio Vault."}

@router.post("/unstake")
async def unstake_card(req: StakeRequest, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    ticker = req.ticker.upper().strip()
    uid = user_id if user_id != "default_user" else req.user_id
    
    card = db.query(DBUserCardCollection).filter(
        DBUserCardCollection.user_id == uid,
        DBUserCardCollection.ticker == ticker,
        DBUserCardCollection.is_staked == True
    ).first()
    
    if not card:
        raise HTTPException(status_code=400, detail=f"No staked copies of {ticker} found in your collection.")
        
    card.is_staked = False
    db.commit()
    
    return {"success": True, "message": f"Unstaked {ticker} successfully."}
