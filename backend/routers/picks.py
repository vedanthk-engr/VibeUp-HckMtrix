import json
from fastapi import APIRouter, Query
from typing import List, Dict, Any
from backend.services.gemma_service import run_research_agent, gemma_complete
from backend.services.rag_service import rag_service

router = APIRouter(prefix="/picks", tags=["Stock Picks"])

async def generate_thesis(ticker, company_name, cms_score, price_data):
    rag_context = await rag_service.query(
        f"{ticker} {company_name} investment thesis fundamentals"
    )
    research = await run_research_agent(
        f"Investment thesis for {ticker}", 
        rag_context
    )
    
    prompt = f"""
    Generate exactly 3 investment thesis bullets for {company_name} ({ticker}).
    
    Research context: {json.dumps(research)}
    CMS Score: {cms_score}/100
    Current price data: {json.dumps(price_data)}
    
    Rules:
    - Each bullet max 15 words
    - Start with action verb
    - Cite one specific data point per bullet
    - Be honest about risks
    
    Return ONLY JSON array: ["bullet1", "bullet2", "bullet3"]
    No markdown. No explanation.
    """
    
    result = await gemma_complete(prompt)
    try:
        return json.loads(result.strip())
    except:
        return [
            "Strong momentum backed by institutional accumulation.",
            "Fundamental metrics improving over last two quarters.", 
            "Risk: sector headwinds could limit near-term upside."
        ]

# Curated stock database with Gen Z theses mapped to themes/profiles
PICKS_DATABASE = {
    "India Glow-up": [
        {
            "name": "Hindustan Aeronautics Ltd",
            "ticker": "HAL",
            "exchange": "NSE",
            "action": "BUY",
            "price": 4200.0,
            "target": 5100.0,
            "stop_loss": 3850.0,
            "upside": 21.4,
            "timeframe": "Long (6-12 months)",
            "thesis": [
                "Defense order book is completely stacked, securing revenue for the next 5 years.",
                "Make-in-India theme is getting massive government funding and export contracts.",
                "Strong return on equity (ROE) of 26% and debt-free balance sheet."
            ],
            "tags": ["#make-in-india", "#defense-capex", "#value-compounder"],
            "sector": "Defense"
        },
        {
            "name": "Tata Steel Limited",
            "ticker": "TATASTEEL",
            "exchange": "NSE",
            "action": "BUY",
            "price": 180.0,
            "target": 220.0,
            "stop_loss": 165.0,
            "upside": 22.2,
            "timeframe": "Medium (1-3 months)",
            "thesis": [
                "Domestic infrastructure boom is driving double-digit steel demand growth.",
                "European operations turning green with subsidies, reducing cash burn.",
                "Technical breakout on the weekly chart above key resistance of ₹168."
            ],
            "tags": ["#infrastructure", "#metals", "#chart-breakout"],
            "sector": "Manufacturing"
        },
        {
            "name": "Larsen & Toubro Ltd",
            "ticker": "LT",
            "exchange": "NSE",
            "action": "BUY",
            "price": 3540.0,
            "target": 4120.0,
            "stop_loss": 3250.0,
            "upside": 16.4,
            "timeframe": "Long (6-12 months)",
            "thesis": [
                "Undisputed leader in India's infrastructure, engineering, and construction space.",
                "Massive order book of over ₹4.5 lakh crore provides multi-year revenue visibility.",
                "Expanding global footprint in Middle East green hydrogen and solar energy projects."
            ],
            "tags": ["#capex-giant", "#infrastructure", "#orderbook-king"],
            "sector": "Infrastructure"
        },
        {
            "name": "Bharat Electronics Ltd",
            "ticker": "BEL",
            "exchange": "NSE",
            "action": "BUY",
            "price": 285.0,
            "target": 340.0,
            "stop_loss": 260.0,
            "upside": 19.3,
            "timeframe": "Medium (1-3 months)",
            "thesis": [
                "Defense electronics powerhouse supplying radar, sonar, and communication systems.",
                "Strong margins driven by domestic manufacturing and localization policies.",
                "Robust pipeline of new orders from army, navy, and air force modernization."
            ],
            "tags": ["#defense-tech", "#indigenisation", "#growth-compounder"],
            "sector": "Defense"
        },
        {
            "name": "Indian Railway Catering & Tourism Corp",
            "ticker": "IRCTC",
            "exchange": "NSE",
            "action": "HOLD",
            "price": 1010.0,
            "target": 1150.0,
            "stop_loss": 920.0,
            "upside": 13.9,
            "timeframe": "Medium (1-3 months)",
            "thesis": [
                "Monopoly in online ticketing, catering, and packaged drinking water for railways.",
                "Rising high-margin Vande Bharat trains boost catering and tourism segments.",
                "Valuation is slightly premium, but consistent free cash flows justify the multiple."
            ],
            "tags": ["#monopoly-moat", "#railway-boom", "#cash-machine"],
            "sector": "Tourism"
        },
        {
            "name": "Rail Vikas Nigam Ltd",
            "ticker": "RVNL",
            "exchange": "NSE",
            "action": "BUY",
            "price": 390.0,
            "target": 480.0,
            "stop_loss": 340.0,
            "upside": 23.1,
            "timeframe": "Short (1-4 weeks)",
            "thesis": [
                "Government's massive rail modernization and metro connectivity capex catalyst.",
                "Fast project execution and high success rate in bagging international bids.",
                "Outstanding order-to-sales ratio makes it a top railway infrastructure pick."
            ],
            "tags": ["#railway-capex", "#high-momentum", "#state-owned"],
            "sector": "Infrastructure"
        }
    ],
    "AI & Tech": [
        {
            "name": "Infosys Limited",
            "ticker": "INFY",
            "exchange": "NSE",
            "action": "HOLD",
            "price": 1520.0,
            "target": 1650.0,
            "stop_loss": 1420.0,
            "upside": 8.5,
            "timeframe": "Medium (1-3 months)",
            "thesis": [
                "Large AI deals pipeline is growing, but margin pressures from wage hikes persist.",
                "US interest rates easing should revive discretionary tech spending next quarter.",
                "Valuation is fair, trading at historical averages. Good for DCA on dips."
            ],
            "tags": ["#it-services", "#ai-pipeline", "#stable-yield"],
            "sector": "IT"
        },
        {
            "name": "Tata Consultancy Services",
            "ticker": "TCS",
            "exchange": "NSE",
            "action": "BUY",
            "price": 3850.0,
            "target": 4400.0,
            "stop_loss": 3600.0,
            "upside": 14.3,
            "timeframe": "Long (6-12 months)",
            "thesis": [
                "Industry-leading operating margins at 26% protect profitability during tech slowdowns.",
                "Major cloud migration contracts with European retail giants.",
                "Solid dividend yield of 3.2% provides a defensive cushion."
            ],
            "tags": ["#it-leader", "#cloud-migration", "#dividend-king"],
            "sector": "IT"
        },
        {
            "name": "Wipro Limited",
            "ticker": "WIPRO",
            "exchange": "NSE",
            "action": "BUY",
            "price": 490.0,
            "target": 560.0,
            "stop_loss": 450.0,
            "upside": 14.3,
            "timeframe": "Medium (1-3 months)",
            "thesis": [
                "New CEO turnaround strategy focusing on large deals and organizational flattening.",
                "Deep capabilities in cybersecurity and enterprise cloud infrastructure.",
                "Attractive valuation relative to peers after a prolonged underperformance."
            ],
            "tags": ["#turnaround-play", "#cybersecurity", "#value-unlock"],
            "sector": "IT"
        },
        {
            "name": "HCL Technologies Ltd",
            "ticker": "HCLTECH",
            "exchange": "NSE",
            "action": "BUY",
            "price": 1440.0,
            "target": 1680.0,
            "stop_loss": 1320.0,
            "upside": 16.7,
            "timeframe": "Long (6-12 months)",
            "thesis": [
                "Strong performance in engineering research & development (ER&D) services.",
                "Consistent market share gains in infrastructure management services (IMS).",
                "Highest dividend payout ratio among large-cap Indian IT companies."
            ],
            "tags": ["#engineering-tech", "#dividend-growth", "#steady-compounder"],
            "sector": "IT"
        },
        {
            "name": "KPIT Technologies Ltd",
            "ticker": "KPITTECH",
            "exchange": "NSE",
            "action": "BUY",
            "price": 1650.0,
            "target": 1980.0,
            "stop_loss": 1480.0,
            "upside": 20.0,
            "timeframe": "Long (6-12 months)",
            "thesis": [
                "Pure-play provider of software integration services to global automotive giants.",
                "Massive secular shift toward Software-Defined Vehicles (SDVs) and autonomous tech.",
                "Strong earnings growth trajectory with EBITDA margins expanding to 20%."
            ],
            "tags": ["#auto-tech", "#autonomous-driving", "#hypergrowth"],
            "sector": "IT"
        },
        {
            "name": "Tata Elxsi Limited",
            "ticker": "TATAELXSI",
            "exchange": "NSE",
            "action": "HOLD",
            "price": 7350.0,
            "target": 8100.0,
            "stop_loss": 6900.0,
            "upside": 10.2,
            "timeframe": "Medium (1-3 months)",
            "thesis": [
                "Premium design and technology service provider for auto, broadcast, and healthcare.",
                "High customer retention and deep engineering expertise in next-gen tech.",
                "Premium valuations reflect its niche position but leave little room for error."
            ],
            "tags": ["#design-thinking", "#premium-tech", "#iot-solutions"],
            "sector": "IT"
        }
    ],
    "Boring & Compounding": [
        {
            "name": "Reliance Industries Ltd",
            "ticker": "RELIANCE",
            "exchange": "NSE",
            "action": "BUY",
            "price": 2950.0,
            "target": 3400.0,
            "stop_loss": 2750.0,
            "upside": 15.2,
            "timeframe": "Long (6-12 months)",
            "thesis": [
                "Jio tariff hikes are boosting telecom ARPUs, lifting telecom segment cashflows.",
                "Retail division expanding footprint rapidly with new smart formats.",
                "Oil-to-chemical margins stabilizing near structural lows, limited downside."
            ],
            "tags": ["#mega-cap", "#telecom-jio", "#retail-growth"],
            "sector": "Consumer"
        },
        {
            "name": "HDFC Bank Limited",
            "ticker": "HDFCBANK",
            "exchange": "NSE",
            "action": "BUY",
            "price": 1600.0,
            "target": 1950.0,
            "stop_loss": 1490.0,
            "upside": 21.8,
            "timeframe": "Long (6-12 months)",
            "thesis": [
                "Post-merger deposit mobilization is beating expectations, improving liquidity.",
                "Valuation is at a 10-year low P/B ratio of 2.1x despite solid credit quality.",
                "Net interest margins (NIMs) are expected to expand as high-cost liabilities mature."
            ],
            "tags": ["#private-banking", "#undervalued", "#compounding-machine"],
            "sector": "Finance"
        },
        {
            "name": "ITC Limited",
            "ticker": "ITC",
            "exchange": "NSE",
            "action": "BUY",
            "price": 430.0,
            "target": 490.0,
            "stop_loss": 395.0,
            "upside": 14.0,
            "timeframe": "Long (6-12 months)",
            "thesis": [
                "Cigarette volume growth remains stable with low taxation surprise risk.",
                "FMCG segment margin expansion and hotels demerger value-unlock play.",
                "Consistent high dividend yield of 3.8% and massive free cash flow generation."
            ],
            "tags": ["#fmcg-giant", "#dividend-yield", "#defensive-moat"],
            "sector": "Consumer"
        },
        {
            "name": "Hindustan Unilever Limited",
            "ticker": "HINDUNILVR",
            "exchange": "NSE",
            "action": "BUY",
            "price": 2450.0,
            "target": 2820.0,
            "stop_loss": 2280.0,
            "upside": 15.1,
            "timeframe": "Long (6-12 months)",
            "thesis": [
                "Recovery in rural demand driven by normal monsoons and government payouts.",
                "Strong pricing power in beauty and personal care portfolio keeps margins high.",
                "Peerless distribution network of over 9 million retail outlets across India."
            ],
            "tags": ["#rural-recovery", "#pricing-power", "#bluechip-safety"],
            "sector": "Consumer"
        },
        {
            "name": "Asian Paints Limited",
            "ticker": "ASIANPAINT",
            "exchange": "NSE",
            "action": "HOLD",
            "price": 2880.0,
            "target": 3150.0,
            "stop_loss": 2720.0,
            "upside": 9.4,
            "timeframe": "Medium (1-3 months)",
            "thesis": [
                "Dominant 60% market share in decorative paints industry remains unchallenged.",
                "Input raw material costs (crude derivatives) softening will support margins.",
                "New entrants in the paint sector raising competitive intensity; monitoring margins."
            ],
            "tags": ["#market-leader", "#brand-equity", "#premium-valuation"],
            "sector": "Chemicals"
        },
        {
            "name": "Kotak Mahindra Bank",
            "ticker": "KOTAKBANK",
            "exchange": "NSE",
            "action": "BUY",
            "price": 1720.0,
            "target": 2040.0,
            "stop_loss": 1580.0,
            "upside": 18.6,
            "timeframe": "Long (6-12 months)",
            "thesis": [
                "Industry-leading capital adequacy ratio and best-in-class asset quality (low NPAs).",
                "Strong growth in digital customer acquisition through the Kotak811 platform.",
                "Attractive valuation after recent underperformance relative to other large private banks."
            ],
            "tags": ["#private-banking", "#capital-efficiency", "#steady-compounder"],
            "sector": "Finance"
        }
    ],
    "High Risk & Momentum": [
        {
            "name": "Zomato Limited",
            "ticker": "ZOMATO",
            "exchange": "NSE",
            "action": "BUY",
            "price": 190.0,
            "target": 260.0,
            "stop_loss": 160.0,
            "upside": 36.8,
            "timeframe": "Short (1-4 weeks)",
            "thesis": [
                "Blinkit (quick commerce) is expanding margins rapidly, outperforming Zepto/Instamart.",
                "Platform fee hikes (from ₹2 to ₹6) are pure bottom-line EBITDA expansion.",
                "Retail trading volumes are reaching all-time highs; massive momentum."
            ],
            "tags": ["#quick-commerce", "#hypergrowth", "#momentum-beast"],
            "sector": "Consumer"
        },
        {
            "name": "One97 Communications",
            "ticker": "PAYTM",
            "exchange": "NSE",
            "action": "AVOID",
            "price": 380.0,
            "target": 310.0,
            "stop_loss": 430.0,
            "upside": -18.4,
            "timeframe": "Short (1-4 weeks)",
            "thesis": [
                "Regulatory compliance crackdowns have halted Payments Bank operations.",
                "Losing UPI market share rapidly to PhonePe and Google Pay.",
                "Uncertain timeline to operating profitability, heavy brand damage."
            ],
            "tags": ["#regulatory-risk", "#declining-share", "#high-volatility"],
            "sector": "Finance"
        },
        {
            "name": "Jio Financial Services",
            "ticker": "JIOFIN",
            "exchange": "NSE",
            "action": "BUY",
            "price": 350.0,
            "target": 440.0,
            "stop_loss": 310.0,
            "upside": 25.7,
            "timeframe": "Medium (1-3 months)",
            "thesis": [
                "Backed by Reliance's massive database of over 450 million telecom/retail users.",
                "JV with BlackRock for asset management, wealth advisory, and brokerage services.",
                "Tech-first, digital-lending model allows rapid scale-up without brick-and-mortar overheads."
            ],
            "tags": ["#digital-lending", "#reliance-pedigree", "#growth-proxy"],
            "sector": "Finance"
        },
        {
            "name": "Indian Renewable Energy Dev",
            "ticker": "IREDA",
            "exchange": "NSE",
            "action": "BUY",
            "price": 185.0,
            "target": 240.0,
            "stop_loss": 160.0,
            "upside": 29.7,
            "timeframe": "Short (1-4 weeks)",
            "thesis": [
                "Nodal agency for financing green energy projects under Ministry of New & Renewable Energy.",
                "Sovereign backing ensures access to low-cost domestic and international capital.",
                "High retail stock interest; massive institutional and retail momentum on green theme."
            ],
            "tags": ["#green-energy", "#sovereign-backed", "#momentum-play"],
            "sector": "Finance"
        },
        {
            "name": "Suzlon Energy Limited",
            "ticker": "SUZLON",
            "exchange": "NSE",
            "action": "BUY",
            "price": 48.0,
            "target": 65.0,
            "stop_loss": 40.0,
            "upside": 35.4,
            "timeframe": "Short (1-4 weeks)",
            "thesis": [
                "Successful debt-restructuring has turned the company net-debt free after many years.",
                "Market leader in wind turbine manufacturing with a 32% market share in India.",
                "Massive order inflows from commercial and industrial customers switching to clean power."
            ],
            "tags": ["#wind-energy", "#debt-free-turnaround", "#high-beta"],
            "sector": "Energy"
        },
        {
            "name": "FSN E-Commerce Ventures",
            "ticker": "NYKAA",
            "exchange": "NSE",
            "action": "HOLD",
            "price": 165.0,
            "target": 185.0,
            "stop_loss": 150.0,
            "upside": 12.1,
            "timeframe": "Medium (1-3 months)",
            "thesis": [
                "Dominant online beauty retailer expanding brick-and-mortar store count rapidly.",
                "Nykaa Fashion segment narrowing EBITDA losses; growth in premium fashion segment.",
                "Stiff competition from Reliance Tira and Tata Cliq Palette limits multiple expansion."
            ],
            "tags": ["#beauty-fmcg", "#e-commerce", "#competitive-market"],
            "sector": "Consumer"
        },
        {
            "name": "Tata Technologies Limited",
            "ticker": "TATATECH",
            "exchange": "NSE",
            "action": "BUY",
            "price": 1050.0,
            "target": 1280.0,
            "stop_loss": 960.0,
            "upside": 21.9,
            "timeframe": "Medium (1-3 months)",
            "thesis": [
                "Highly-rated IPO with deep ER&D partnerships with JLR and global EV OEMs.",
                "Synergies with Tata Motors EV rollout provide consistent baseline business.",
                "Strong cash generation and high ROE make it a solid mid-cap tech-momentum compounder."
            ],
            "tags": ["#ev-engineering", "#tata-group", "#midcap-tech"],
            "sector": "IT"
        },
        {
            "name": "Vodafone Idea Limited",
            "ticker": "IDEA",
            "exchange": "NSE",
            "action": "AVOID",
            "price": 13.0,
            "target": 9.0,
            "stop_loss": 16.0,
            "upside": -30.8,
            "timeframe": "Short (1-4 weeks)",
            "thesis": [
                "Heavy subscriber churn continues toward Jio and Airtel.",
                "Massive AGR dues and debt liabilities keep balance sheet extremely stressed.",
                "Recent FPO funding helps capex, but 5G rollout lags competitors significantly."
            ],
            "tags": ["#telecom-struggle", "#high-debt", "#turnaround-gamble"],
            "sector": "Telecom"
        },
        {
            "name": "Housing & Urban Development",
            "ticker": "HUDCO",
            "exchange": "NSE",
            "action": "BUY",
            "price": 220.0,
            "target": 280.0,
            "stop_loss": 195.0,
            "upside": 27.3,
            "timeframe": "Short (1-4 weeks)",
            "thesis": [
                "Direct beneficiary of government's PMAY (Pradhan Mantri Awas Yojana) housing scheme expansion.",
                "Extremely low NPA levels due to lending primarily to state government agencies.",
                "Strong momentum on the back of public sector undertaking (PSU) re-ratings."
            ],
            "tags": ["#affordable-housing", "#psu-re-rating", "#momentum-stock"],
            "sector": "Finance"
        }
    ],
    "Global & Diversified": [
        {
            "name": "Nippon India ETF Gold BeES",
            "ticker": "GOLDBEES",
            "exchange": "NSE",
            "action": "BUY",
            "price": 62.0,
            "target": 72.0,
            "stop_loss": 58.0,
            "upside": 16.1,
            "timeframe": "Medium (1-3 months)",
            "thesis": [
                "Global geopolitical tensions driving central banks to buy gold reserves.",
                "Inflation hedge assets are outperforming equity indexes in high-rate environments.",
                "Liquidity is extremely high, allowing easy exit and entry."
            ],
            "tags": ["#gold-standard", "#hedging", "#defensive-play"],
            "sector": "Commodities"
        },
        {
            "name": "Motilal Oswal Nasdaq 100 ETF",
            "ticker": "MON100",
            "exchange": "NSE",
            "action": "BUY",
            "price": 145.0,
            "target": 170.0,
            "stop_loss": 133.0,
            "upside": 17.2,
            "timeframe": "Long (6-12 months)",
            "thesis": [
                "Direct exposure to US tech titans (Apple, Microsoft, Nvidia, Alphabet) in INR.",
                "Hedge against Rupee depreciation as index assets are dollar-denominated.",
                "Consistent compounding track record driven by global generative AI boom."
            ],
            "tags": ["#us-tech", "#dollar-hedge", "#global-diversification"],
            "sector": "Index"
        },
        {
            "name": "Mirae Asset NYSE FANG+ ETF",
            "ticker": "FANG",
            "exchange": "NSE",
            "action": "BUY",
            "price": 92.0,
            "target": 110.0,
            "stop_loss": 84.0,
            "upside": 19.6,
            "timeframe": "Long (6-12 months)",
            "thesis": [
                "Highly concentrated exposure to the top 10 tech giants leading the digital revolution.",
                "Outperformance of the FANG+ index relative to traditional broad market indices.",
                "Ideal for capturing high-growth global innovation waves."
            ],
            "tags": ["#magnificent-7", "#ai-leaders", "#international-etf"],
            "sector": "Index"
        },
        {
            "name": "Nippon India ETF Silver BeES",
            "ticker": "SILVERBEES",
            "exchange": "NSE",
            "action": "BUY",
            "price": 85.0,
            "target": 102.0,
            "stop_loss": 76.0,
            "upside": 20.0,
            "timeframe": "Medium (1-3 months)",
            "thesis": [
                "Rising industrial demand for silver in solar PVs, EVs, and electronics.",
                "Silver historically acts as a high-beta proxy to gold bull runs.",
                "Liquid, cost-effective, and safe way to hold physical silver without locker risk."
            ],
            "tags": ["#industrial-metals", "#silver-bull", "#commodities"],
            "sector": "Commodities"
        },
        {
            "name": "Nippon India ETF Nifty BeES",
            "ticker": "NIFTYBEES",
            "exchange": "NSE",
            "action": "BUY",
            "price": 250.0,
            "target": 285.0,
            "stop_loss": 235.0,
            "upside": 14.0,
            "timeframe": "Long (6-12 months)",
            "thesis": [
                "Lowest cost index fund tracking the top 50 largest blue-chip Indian companies.",
                "Matches India's GDP growth trajectory with zero unsystematic fund manager risk.",
                "Highly liquid with near-zero tracking error, perfect for long-term core portfolios."
            ],
            "tags": ["#nifty-50", "#index-investing", "#core-portfolio"],
            "sector": "Index"
        }
    ]
}

@router.get("/daily")
async def get_daily_picks(
    archetype: str = Query("FOMO Trader", description="Risk archetype (Optimizer, Slow Builder, FOMO Trader, Thrill Chaser)"),
    sector: str = Query("All", description="Sector filtering")
):
    """Retrieve daily stock recommendations matched to risk profile and sector preferences."""
    # Map risk archetypes to themes
    # Optimizer -> India Glow-up + AI & Tech
    # Slow Builder -> Boring & Compounding + Global & Diversified
    # FOMO Trader -> High Risk & Momentum + AI & Tech
    # Thrill Chaser -> High Risk & Momentum
    
    themes = []
    if archetype == "Optimizer":
        themes = ["India Glow-up", "AI & Tech"]
    elif archetype == "Slow Builder":
        themes = ["Boring & Compounding", "Global & Diversified"]
    elif archetype == "FOMO Trader":
        themes = ["High Risk & Momentum", "AI & Tech"]
    elif archetype == "Thrill Chaser":
        themes = ["High Risk & Momentum"]
    else:
        themes = ["Boring & Compounding", "India Glow-up"]
        
    recommendations = []
    for theme in themes:
        if theme in PICKS_DATABASE:
            recommendations.extend(PICKS_DATABASE[theme])
            
    # Filter by sector if provided
    if sector != "All":
        recommendations = [r for r in recommendations if r["sector"].upper() == sector.upper()]
        
    return recommendations
