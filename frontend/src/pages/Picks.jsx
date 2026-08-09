import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useVibeStore } from '../store/vibeStore'
import { api } from '../lib/api'
import { StockPickCard } from '../components/Picks/StockPickCard'
import { LoadingPulse } from '../components/shared/LoadingPulse'
import { SlidersHorizontal, Info, Sparkles } from 'lucide-react'

// Theme categories matching the mockup
const THEME_CATEGORIES = [
  { key: 'All', label: 'All Picks' },
  { key: 'Momentum', label: 'High Momentum 🔥' },
  { key: 'Undervalued', label: 'Undervalued 💎' },
  { key: 'Earnings', label: 'Earnings Play 📊' },
]

// Standard seed recommendations for offline fallback, mapped to theme categories
const SEED_PICKS = [
  {
    name: "Zomato Limited",
    ticker: "ZOMATO",
    exchange: "NSE",
    action: "BUY",
    price: 194.20,
    target: 260.00,
    stop_loss: 165.00,
    upside: 33.8,
    timeframe: "Short (1-4 weeks)",
    thesis: [
      "Blinkit (quick commerce) is expanding margins rapidly, outperforming major sector competitors.",
      "Platform fee hikes (from ₹2 to ₹6) are pure bottom-line EBITDA expansion.",
      "Retail trading volumes are reaching all-time highs; massive momentum."
    ],
    tags: ["#quick-commerce", "#hypergrowth", "#momentum-beast"],
    sector: "Consumer",
    theme: "Momentum"
  },
  {
    name: "Hindustan Aeronautics Ltd",
    ticker: "HAL",
    exchange: "NSE",
    action: "BUY",
    price: 4200.00,
    target: 5100.00,
    stop_loss: 3850.00,
    upside: 21.4,
    timeframe: "Long (6-12 months)",
    thesis: [
      "Defense order book is completely stacked, securing revenue for the next 5 years.",
      "Make-in-India theme is getting massive government funding and export contracts.",
      "Strong return on equity (ROE) of 26% and debt-free balance sheet."
    ],
    tags: ["#make-in-india", "#defense-capex", "#value-compounder"],
    sector: "Defense",
    theme: "Undervalued"
  },
  {
    name: "Tata Steel Limited",
    ticker: "TATASTEEL",
    exchange: "NSE",
    action: "BUY",
    price: 181.10,
    target: 220.00,
    stop_loss: 165.00,
    upside: 21.5,
    timeframe: "Medium (1-3 months)",
    thesis: [
      "Domestic infrastructure boom is driving double-digit steel demand growth.",
      "European operations turning green with subsidies, reducing cash burn.",
      "Technical breakout on the weekly chart above key resistance of ₹168."
    ],
    tags: ["#infrastructure", "#metals", "#chart-breakout"],
    sector: "Manufacturing",
    theme: "Momentum"
  },
  {
    name: "Titan Company Ltd",
    ticker: "TITAN",
    exchange: "NSE",
    action: "BUY",
    price: 3410.50,
    target: 3900.00,
    stop_loss: 3100.00,
    upside: 14.4,
    timeframe: "Medium (1-3 months)",
    thesis: [
      "Customs duty cut on gold imports (15% → 10%) will expand jewelry margins by 1.2%.",
      "CaratLane acquisition integration driving premium digital-first sales.",
      "Strong brand moat with 25% ROE and 10-year track record of compounding."
    ],
    tags: ["#consumer-luxury", "#compounder", "#gold-proxy"],
    sector: "Consumer",
    theme: "Earnings"
  },
  {
    name: "Reliance Industries Ltd",
    ticker: "RELIANCE",
    exchange: "NSE",
    action: "BUY",
    price: 2950.00,
    target: 3400.00,
    stop_loss: 2750.00,
    upside: 15.2,
    timeframe: "Long (6-12 months)",
    thesis: [
      "Jio tariff hikes are boosting telecom ARPUs, lifting telecom segment cashflows.",
      "Retail division expanding footprint rapidly with new smart formats.",
      "Oil-to-chemical margins stabilizing near structural lows, limited downside."
    ],
    tags: ["#mega-cap", "#telecom-jio", "#retail-growth"],
    sector: "Conglomerate",
    theme: "Undervalued"
  },
  {
    name: "Tata Motors Ltd",
    ticker: "TATAMOTORS",
    exchange: "NSE",
    action: "BUY",
    price: 980.00,
    target: 1200.00,
    stop_loss: 880.00,
    upside: 22.4,
    timeframe: "Medium (1-3 months)",
    thesis: [
      "JLR EBIT margins at 8.5% — best quarter in a decade, crushing analyst targets.",
      "EV market share in India at 72% for passenger EVs. Massive first-mover moat.",
      "Net debt reduced by ₹12,000 Cr in FY24 — balance sheet de-risked."
    ],
    tags: ["#ev-leader", "#jlr-turnaround", "#earnings-beat"],
    sector: "Auto",
    theme: "Earnings"
  },
  {
    name: "Jio Financial Services",
    ticker: "JIOFIN",
    exchange: "NSE",
    action: "BUY",
    price: 350.00,
    target: 440.00,
    stop_loss: 310.00,
    upside: 25.7,
    timeframe: "Medium (1-3 months)",
    thesis: [
      "Backed by Reliance's massive database of over 450 million telecom/retail users.",
      "JV with BlackRock for asset management, wealth advisory, and brokerage services.",
      "Tech-first, digital-lending model allows rapid scale-up without brick-and-mortar overheads."
    ],
    tags: ["#digital-lending", "#reliance-pedigree", "#growth-proxy"],
    sector: "Finance",
    theme: "Momentum"
  },
  {
    name: "HDFC Bank Limited",
    ticker: "HDFCBANK",
    exchange: "NSE",
    action: "BUY",
    price: 1600.00,
    target: 1950.00,
    stop_loss: 1490.00,
    upside: 21.8,
    timeframe: "Long (6-12 months)",
    thesis: [
      "Post-merger deposit mobilization is beating expectations, improving liquidity.",
      "Valuation is at a 10-year low P/B ratio of 2.1x despite solid credit quality.",
      "Net interest margins (NIMs) are expected to expand as high-cost liabilities mature."
    ],
    tags: ["#private-banking", "#undervalued", "#compounding-machine"],
    sector: "Finance",
    theme: "Undervalued"
  },
  {
    name: "Infosys Limited",
    ticker: "INFY",
    exchange: "NSE",
    action: "HOLD",
    price: 1520.00,
    target: 1650.00,
    stop_loss: 1420.00,
    upside: 8.5,
    timeframe: "Medium (1-3 months)",
    thesis: [
      "Large AI deals pipeline is growing, but margin pressures from wage hikes persist.",
      "US interest rates easing should revive discretionary tech spending next quarter.",
      "Valuation is fair, trading at historical averages. Good for DCA on dips."
    ],
    tags: ["#it-services", "#ai-pipeline", "#stable-yield"],
    sector: "IT",
    theme: "Earnings"
  }
]

export function Picks() {
  const { riskArchetype } = useVibeStore()
  
  const [picks, setPicks] = useState([])
  const [themeFilter, setThemeFilter] = useState('All')
  const [sortBy, setSortBy] = useState('Conviction') // Conviction, Upside, Risk
  const [loading, setLoading] = useState(true)
  const [visibleLimit, setVisibleLimit] = useState(9)

  useEffect(() => {
    setVisibleLimit(9)
  }, [riskArchetype, themeFilter])

  useEffect(() => {
    const fetchPicks = async () => {
      setLoading(true)
      try {
        const response = await api.get(`/picks/daily?archetype=${riskArchetype}&sector=All`)
        if (response.data && response.data.length > 0) {
          // Map server picks to theme categories if they don't have them
          const mappedPicks = response.data.map(p => {
            if (!p.theme) {
              // Auto-assign themes based on keywords
              if (p.upside > 25 || (p.tags || []).some(t => t.includes('momentum'))) {
                p.theme = 'Momentum'
              } else if (p.upside > 15 || (p.tags || []).some(t => t.includes('undervalued') || t.includes('value'))) {
                p.theme = 'Undervalued'
              } else {
                p.theme = 'Earnings'
              }
            }
            return p
          })
          setPicks(mappedPicks)
        } else {
          setPicks(SEED_PICKS)
        }
      } catch (err) {
        console.warn('Picks fetch failed, using fallback database:', err)
        setPicks(SEED_PICKS)
      } finally {
        setLoading(false)
      }
    }
    fetchPicks()
  }, [riskArchetype])

  // Filter by theme
  const filteredPicks = themeFilter === 'All'
    ? picks
    : picks.filter(p => p.theme === themeFilter)

  // Sorting logic
  const sortedPicks = [...filteredPicks].sort((a, b) => {
    if (sortBy === 'Conviction') {
      const actionScore = (act) => {
        if (act === 'BUY') return 3
        if (act === 'HOLD') return 2
        return 1 // AVOID
      }
      return actionScore(b.action) - actionScore(a.action)
    }
    if (sortBy === 'Upside') {
      return (b.upside || 0) - (a.upside || 0)
    }
    if (sortBy === 'Risk') {
      const riskScore = (act) => {
        if (act === 'AVOID') return 3
        if (act === 'HOLD') return 2
        return 1
      }
      return riskScore(b.action) - riskScore(a.action)
    }
    return a.ticker.localeCompare(b.ticker)
  })

  const FILTER_ROTATIONS = {
    'All': '-rotate-1',
    'Momentum': 'rotate-2',
    'Undervalued': '-rotate-2',
    'Earnings': 'rotate-1'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-6xl mx-auto px-4 md:pl-10 pt-6 pb-32 text-left"
    >
      {/* Header */}
      <header className="mb-12 relative z-10 select-none">
        <div className="relative inline-block">
          <h1 className="font-display text-[40px] md:text-[80px] mb-4 text-[#1c1b1b] tracking-tighter drop-shadow-[4px_4px_0px_#7dd3fc] leading-none">
            Vibe Pick 🎯
          </h1>
          
          {/* Decorative Doodles */}
          <svg className="absolute -top-6 -left-8 z-0 star-doodle" fill="none" height="50" viewBox="0 0 40 40" width="50" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 0L23.5 16.5L40 20L23.5 23.5L20 40L16.5 23.5L0 20L16.5 16.5L20 0Z" fill="#fde047" stroke="#1c1b1b" strokeWidth="2"></path>
          </svg>
          <svg className="absolute top-0 -right-16 z-0" fill="none" height="40" style={{ transform: 'rotate(25deg)' }} viewBox="0 0 30 40" width="40" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 0L30 20H20L25 40L0 15H15L15 0Z" fill="#ffb690" stroke="#1c1b1b" strokeWidth="2"></path>
          </svg>
        </div>

        <div className="flex items-center flex-wrap gap-3 mt-2">
          <span className="font-headline text-sm md:text-base text-zinc-700 font-bold bg-white px-3 py-1.5 border-3 border-black rounded-lg inline-block transform rotate-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            personalised for your
          </span>
          <span className="bg-[#630ed4] text-white px-4 py-1.5 rounded-full font-bold border-3 border-black transform -rotate-3 inline-block shadow-[4px_4px_0px_#1c1b1b]">
            {riskArchetype}
          </span>
          <span className="font-headline text-sm md:text-base text-zinc-700 font-bold bg-white px-3 py-1.5 border-3 border-black rounded-lg inline-block transform rotate-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            profile
          </span>
        </div>

        {/* Theme Category Filters and Sorters */}
        <div className="flex flex-wrap items-center justify-between gap-6 mt-10 border-t-2 border-black border-dashed pt-6">
          {/* Theme Filter Chips */}
          <div className="flex flex-wrap items-center gap-4">
            {THEME_CATEGORIES.map((cat) => {
              const rotation = FILTER_ROTATIONS[cat.key] || 'rotate-1'
              const isActive = themeFilter === cat.key
              return (
                <button
                  key={cat.key}
                  onClick={() => setThemeFilter(cat.key)}
                  className={`
                    px-5 py-2.5 rounded-full font-bold transition-all cursor-pointer pill-btn transform text-sm
                    ${rotation}
                    ${isActive 
                      ? 'bg-[#1c1b1b] text-white shadow-[4px_4px_0px_0px_#1c1b1b]' 
                      : 'bg-white text-[#1c1b1b] hover:bg-[#eae7e7] shadow-[4px_4px_0px_0px_#1c1b1b]'
                    }
                  `}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Sorter */}
          <div className="flex items-center gap-2 bg-white border-3 border-black rounded-xl p-1.5 text-xs shadow-[3px_3px_0px_#1c1b1b]">
            <SlidersHorizontal size={14} className="text-zinc-600 ml-2" />
            <span className="text-black font-bold font-headline uppercase mr-1">Sort:</span>
            {['Conviction', 'Upside', 'Risk'].map((opt) => (
              <button
                key={opt}
                onClick={() => setSortBy(opt)}
                className={`
                  px-3 py-1 rounded-lg font-bold transition-all cursor-pointer
                  ${sortBy === opt ? 'bg-[#1c1b1b] text-white' : 'text-zinc-600 hover:text-black'}
                `}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* RAG Disclaimer banner */}
      <div className="bg-white border-3 border-black rounded-2xl p-4 flex gap-3 items-start mb-8 shadow-[4px_4px_0px_#1c1b1b]">
        <Info className="text-[#630ed4] shrink-0 mt-0.5" size={16} />
        <p className="text-[10px] text-zinc-600 leading-relaxed font-semibold">
          These picks are computed based on public RSS news channels, recent SEBI disclosures, and technical charts. VibeUp is a co-pilot, not a registered investment advisor. Always practice due diligence (DYOR) before placing funds.
        </p>
      </div>

      {/* Recommendations Grid */}
      {loading ? (
        <div className="grid gap-x-10 gap-y-12 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <LoadingPulse />
          <LoadingPulse />
        </div>
      ) : (
        <>
          <div className="grid gap-x-10 gap-y-12 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start">
            {sortedPicks.slice(0, visibleLimit).map((pick, i) => (
              <StockPickCard key={pick.ticker || i} pick={pick} index={i} />
            ))}
            {sortedPicks.length === 0 && (
              <div className="col-span-full text-center py-16">
                <p className="font-display text-3xl text-zinc-300 mb-2">No picks here yet</p>
                <p className="text-sm text-zinc-400 font-bold">Try switching filters or check back later.</p>
              </div>
            )}
          </div>

          {/* Explore More Button */}
          {visibleLimit < sortedPicks.length && (
            <div className="flex flex-col items-center justify-center mt-16 mb-8">
              <button
                onClick={() => setVisibleLimit((prev) => prev + 3)}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl border-3 border-black bg-white hover:bg-zinc-50 font-bold font-display text-lg text-black transition-all cursor-pointer shadow-[6px_6px_0px_#1c1b1b] active:translate-y-1 active:shadow-[2px_2px_0px_#1c1b1b] transform hover:-translate-y-0.5 hover:-rotate-1"
              >
                <span>Explore More</span>
                <span className="text-xl animate-bounce">➔</span>
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

export default Picks
