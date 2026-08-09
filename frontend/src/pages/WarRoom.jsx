import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { CandlestickChart } from '../components/WarRoom/CandlestickChart'
import { useVibeStore } from '../store/vibeStore'
import { api } from '../lib/api'
import { 
  Sparkles, ArrowUpRight, ArrowDownRight, RefreshCw, 
  Send, ShieldAlert, BadgeCheck, Landmark, Trash2, Info, TrendingUp, AlertCircle, HelpCircle
} from 'lucide-react'

export function WarRoom() {
  const { setActivePage, riskArchetype, holdings, fetchHoldings, addHolding, deleteHolding } = useVibeStore()
  
  // Standard preset stocks per archetype
  const ARCHETYPE_STOCKS = {
    'Slow Builder': ['RELIANCE', 'HDFCBANK', 'INFY', 'TITAN', 'TCS'],
    'Optimizer': ['HAL', 'TATASTEEL', 'LT', 'COALINDIA', 'RELIANCE'],
    'FOMO Trader': ['ZOMATO', 'TATAELXSI', 'JIOFIN', 'TITAN', 'HAL'],
    'Thrill Chaser': ['SUZLON', 'IREDA', 'TRENT', 'ZOMATO', 'TATASTEEL']
  }
  
  const defaultSymbol = ARCHETYPE_STOCKS[riskArchetype]?.[0] || 'ZOMATO'
  const [activeSymbol, setActiveSymbol] = useState(defaultSymbol)

  // Live state definitions
  const [liveSignals, setLiveSignals] = useState([])
  const [loadingSignals, setLoadingSignals] = useState(true)
  const [vibePicks, setVibePicks] = useState([])
  const [loadingPicks, setLoadingPicks] = useState(true)
  const [showPicksInfo, setShowPicksInfo] = useState(false)
  const [isGrowwConnected, setIsGrowwConnected] = useState(() => localStorage.getItem('isGrowwConnected') === 'true')

  // Whale and Sector Collapsible Panel States & Data
  const [whaleTrades, setWhaleTrades] = useState([])
  const [sectorHeatmap, setSectorHeatmap] = useState([])
  const [whalePanelOpen, setWhalePanelOpen] = useState(true)
  const [sectorPanelOpen, setSectorPanelOpen] = useState(true)

  // Tactical Execution Console state
  const [tradeTicker, setTradeTicker] = useState(activeSymbol)
  const [tradeType, setTradeType] = useState('BUY') // BUY or SELL
  const [tradeQuantity, setTradeQuantity] = useState(10)
  const [tradeAccount, setTradeAccount] = useState('paper') // paper or groww
  const [executingTrade, setExecutingTrade] = useState(false)
  const [tradeSuccess, setTradeSuccess] = useState(false)
  const [tradeSuccessMsg, setTradeSuccessMsg] = useState('')

  // AI Vibe Check state
  const [aiResponse, setAiResponse] = useState('')
  const [loadingAi, setLoadingAi] = useState(false)

  // Watch for symbol changes to keep dropdown synced
  useEffect(() => {
    setTradeTicker(activeSymbol)
  }, [activeSymbol])

  // Sync holdings from store
  useEffect(() => {
    fetchHoldings()
    
    // Check Groww connection state on mount
    const checkGroww = () => {
      setIsGrowwConnected(localStorage.getItem('isGrowwConnected') === 'true')
    }
    window.addEventListener('storage', checkGroww)
    // Poll localstorage periodically in case of in-page changes
    const interval = setInterval(checkGroww, 2000)
    
    return () => {
      window.removeEventListener('storage', checkGroww)
      clearInterval(interval)
    }
  }, [])

  // Fetch daily picks from backend API
  useEffect(() => {
    const fetchPicks = async () => {
      setLoadingPicks(true)
      try {
        const response = await api.get(`/picks/daily?archetype=${riskArchetype}&sector=All`)
        if (response.data && response.data.length > 0) {
          setVibePicks(response.data.slice(0, 2))
        } else {
          // Fallback picks
          setVibePicks([
            { ticker: 'HAL', action: 'BUY', price: 4200.0, target: 5100.0, stop_loss: 3850.0, reasoning: 'Defense order book is stacked.' },
            { ticker: 'TITAN', action: 'BUY', price: 3410.5, target: 3900.0, stop_loss: 3100.0, reasoning: 'Duty cut on gold imports expands margins.' }
          ])
        }
      } catch (err) {
        console.warn('Failed to load picks for War Room, using fallbacks:', err)
        setVibePicks([
          { ticker: 'HAL', action: 'BUY', price: 4200.0, target: 5100.0, stop_loss: 3850.0, reasoning: 'Defense order book is stacked.' },
          { ticker: 'TITAN', action: 'BUY', price: 3410.5, target: 3900.0, stop_loss: 3100.0, reasoning: 'Duty cut on gold imports expands margins.' }
        ])
      } finally {
        setLoadingPicks(false)
      }
    }
    fetchPicks()
  }, [riskArchetype])

  // Establish SSE stream connection for Live Signals
  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const eventSource = new EventSource(`${apiBaseUrl}/api/signals/stream`)
    setLoadingSignals(true)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.heartbeat || data.status === 'complete') return
        
        setLoadingSignals(false)
        setLiveSignals(prev => {
          const exists = prev.some(s => s.ticker === data.ticker)
          if (exists) {
            return prev.map(s => s.ticker === data.ticker ? data : s)
          }
          return [data, ...prev].slice(0, 3) // Keep top 3 most recent signals
        })
      } catch (e) {
        console.error('Error parsing SSE in War Room:', e)
      }
    }
    
    eventSource.onerror = () => {
      // Offline fallback signals
      setLiveSignals([
        { ticker: 'ZOMATO', signal_type: 'ACT', price: 194.20, change: 3.82, confidence: 86, reasoning: 'Blinkit Q4 EBITDA turned positive ahead of target.' },
        { ticker: 'TITAN', signal_type: 'WATCH', price: 3410.50, change: 1.12, confidence: 68, reasoning: 'Gold duty cut expands margin guidelines.' },
        { ticker: 'HAL', signal_type: 'ACT', price: 4120.00, change: 6.70, confidence: 92, reasoning: 'Defence RFP for 156 combat helicopters.' }
      ])
      setLoadingSignals(false)
      eventSource.close()
    }

    return () => eventSource.close()
  }, [])

  // Fetch sector pulse data
  useEffect(() => {
    const fetchPulse = async () => {
      try {
        const response = await api.get('/sector-pulse')
        if (response.data && response.data.heatmap) {
          setSectorHeatmap(response.data.heatmap.slice(0, 5))
        }
      } catch (err) {
        console.warn('Failed to load sector pulse in War Room:', err)
        setSectorHeatmap([
          { name: 'Finance', weekly_change: 1.45, top_stock: 'HDFCBANK' },
          { name: 'IT', weekly_change: -0.85, top_stock: 'INFY' },
          { name: 'Energy', weekly_change: 2.10, top_stock: 'RELIANCE' },
          { name: 'Auto', weekly_change: 0.95, top_stock: 'TATAMOTORS' },
          { name: 'Consumer', weekly_change: -1.25, top_stock: 'TITAN' }
        ])
      }
    }
    fetchPulse()
  }, [])

  // Listen to block trades SSE stream
  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const blockSse = new EventSource(`${apiBaseUrl}/api/whale/block-trades`)
    
    blockSse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setWhaleTrades(prev => [data, ...prev].slice(0, 5))
      } catch (err) {
        console.warn('Failed to parse block trade event in War Room:', err)
      }
    }
    
    blockSse.onerror = () => {
      // Offline fallback initial trades
      setWhaleTrades([
        { time: '17:34:10', ticker: 'ZOMATO', side: 'BUY', units: 4500000, value_cr: 82.12, aurex_take: 'Big money accumulator loading positions near support.' },
        { time: '17:28:45', ticker: 'HAL', side: 'BUY', units: 120000, value_cr: 50.52, aurex_take: 'High conviction block transaction; aligns with sector momentum.' },
        { time: '17:15:12', ticker: 'TITAN', side: 'SELL', units: 85000, value_cr: 29.02, aurex_take: 'Block exit by institutional investor; expect brief supply overhead.' },
        { time: '16:55:04', ticker: 'RELIANCE', side: 'BUY', units: 280000, value_cr: 79.63, aurex_take: 'Strategic promoter block placement; long-term consolidation target.' },
        { time: '16:40:22', ticker: 'TRENT', side: 'BUY', units: 95000, value_cr: 47.02, aurex_take: 'Arbitrage execution block trade; minor volatility indicator.' }
      ])
      blockSse.close()
    }
    
    return () => blockSse.close()
  }, [])

  const handleSymbolChange = (symbol) => {
    setActiveSymbol(symbol)
  }

  const handleMicClick = () => {
    setActivePage('chat')
  }

  const handleTradeOnGroww = (sym) => {
    const cleanSym = (sym || 'ZOMATO').toUpperCase().replace('.NS', '').replace('.BO', '')
    const growwUrl = `https://groww.in/stocks/${cleanSym.toLowerCase()}?utm_source=vibeup&utm_medium=app`
    window.open(growwUrl, '_blank')
  }

  const handleSellHolding = async (e, id, ticker) => {
    e.stopPropagation()
    if (window.confirm(`Are you sure you want to sell your entire position in ${ticker}?`)) {
      try {
        await deleteHolding(id)
        await fetchHoldings()
      } catch (err) {
        console.error('Failed to sell holding:', err)
      }
    }
  }

  // Portfolio calculations for "Your Bag"
  const { totalValue, totalCost, totalPnl, totalPnlPct } = useMemo(() => {
    let cost = 0
    let value = 0
    holdings.forEach(h => {
      cost += h.quantity * h.avg_buy_price
      value += h.quantity * (h.current_price || h.avg_buy_price)
    })
    const pnl = value - cost
    const pct = cost > 0 ? (pnl / cost) * 100 : 0
    return { 
      totalValue: Math.round(value), 
      totalCost: Math.round(cost), 
      totalPnl: Math.round(pnl), 
      totalPnlPct: Math.round(pct * 100) / 100 
    }
  }, [holdings])

  // Donut chart calculations
  const donutSlices = useMemo(() => {
    if (holdings.length === 0) return []
    const sorted = [...holdings].map(h => ({
      ticker: h.ticker,
      value: h.quantity * (h.current_price || h.avg_buy_price)
    })).sort((a, b) => b.value - a.value)
    
    const total = sorted.reduce((sum, item) => sum + item.value, 0)
    if (total === 0) return []
    
    const top3 = sorted.slice(0, 3)
    const othersVal = sorted.slice(3).reduce((sum, item) => sum + item.value, 0)
    
    const items = top3.map(item => ({
      name: item.ticker,
      percentage: (item.value / total) * 100
    }))
    
    if (othersVal > 0) {
      items.push({
        name: 'Others',
        percentage: (othersVal / total) * 100
      })
    }
    
    let currentOffset = 0
    const colors = ['#7c3aed', '#fd56a7', '#fde047', '#00d09c', '#38bdf8']
    return items.map((item, index) => {
      const dash = (item.percentage / 100) * 220
      const slice = {
        name: item.name,
        percentage: item.percentage,
        dash: `${dash} ${220 - dash}`,
        offset: -currentOffset,
        color: colors[index % colors.length]
      }
      currentOffset += dash
      return slice
    })
  }, [holdings])

  // Trade Ticket Price Lookup
  const tradeTickerPrice = useMemo(() => {
    const fromHoldings = holdings.find(h => h.ticker === tradeTicker.toUpperCase())
    if (fromHoldings && fromHoldings.current_price) return fromHoldings.current_price
    const fromSignals = liveSignals.find(s => s.ticker === tradeTicker.toUpperCase())
    if (fromSignals && fromSignals.price) return fromSignals.price
    
    // Fallback baseline prices
    const baselines = {
      ZOMATO: 194.20, TITAN: 3410.50, ADANIPORTS: 1420.90, TATASTEEL: 181.10, INFY: 1512.40,
      RELIANCE: 2890.30, TCS: 3950.00, PAYTM: 378.40, HAL: 4120.00, HDFCBANK: 1610.20,
      ICICIBANK: 1150.50, ITC: 430.15, SBIN: 825.40, BHARTIARTL: 1410.60, LTIM: 4920.00,
      MARUTI: 12200.00, TATACHEM: 1080.40, JIOFIN: 355.80, IREDA: 192.50, RVNL: 385.20,
      PFC: 420.00, ONGC: 260.00
    }
    return baselines[tradeTicker.toUpperCase()] || 150.0
  }, [tradeTicker, holdings, liveSignals])

  // Trade Order Executor
  const handleExecuteTrade = async (e) => {
    e.preventDefault()
    if (!tradeQuantity || tradeQuantity <= 0) return
    
    setExecutingTrade(true)
    setTradeSuccess(false)
    
    try {
      if (tradeType === 'BUY') {
        await addHolding({
          ticker: tradeTicker.toUpperCase(),
          quantity: parseFloat(tradeQuantity),
          avg_buy_price: parseFloat(tradeTickerPrice),
          buy_date: new Date().toISOString().split('T')[0],
          is_paper: tradeAccount === 'paper',
          exchange: 'NSE'
        })
        setTradeSuccessMsg(`Order Executed! Bought ${tradeQuantity} shares of ${tradeTicker} @ ₹${tradeTickerPrice}.`)
      } else {
        const matches = holdings.filter(h => h.ticker === tradeTicker.toUpperCase() && (tradeAccount === 'paper' ? h.is_paper : !h.is_paper))
        if (matches.length === 0) {
          alert(`You do not own any ${tradeTicker} in your ${tradeAccount === 'paper' ? 'Paper' : 'Groww'} portfolio!`)
          setExecutingTrade(false)
          return
        }
        
        const h = matches[0]
        if (h.quantity <= tradeQuantity) {
          await deleteHolding(h.id)
        } else {
          await deleteHolding(h.id)
          await addHolding({
            ticker: h.ticker,
            quantity: h.quantity - parseFloat(tradeQuantity),
            avg_buy_price: h.avg_buy_price,
            buy_date: h.buy_date,
            is_paper: h.is_paper,
            exchange: h.exchange
          })
        }
        setTradeSuccessMsg(`Order Executed! Sold ${tradeQuantity} shares of ${tradeTicker} @ ₹${tradeTickerPrice}.`)
      }
      
      setTradeSuccess(true)
      await fetchHoldings()
      setTimeout(() => setTradeSuccess(false), 5000)
    } catch (err) {
      console.error('Execution of trade failed:', err)
      alert('Trade execution failed: ' + err.message)
    } finally {
      setExecutingTrade(false)
    }
  }

  // AI Vibe Check Handler
  const handleAiVibeCheck = async () => {
    setLoadingAi(true)
    setAiResponse('')
    try {
      const res = await api.get(`/signals/ticker/${activeSymbol}`)
      if (res.data && res.data.reasoning) {
        setAiResponse(`"${res.data.reasoning}" (Conviction: ${res.data.confidence}%)`)
      } else {
        setAiResponse(`No detailed AI summary found for ${activeSymbol}. Ticker is showing consolidated vibes.`)
      }
    } catch (err) {
      // Fallback response generator
      const fallbacks = [
        `${activeSymbol} is giving major main character energy today. RSI is breaking out, FIIs are stacking up, and volume is absolutely bussin. Bullish breakout incoming, no cap.`,
        `${activeSymbol} is giving quiet luxury vibes. Moving averages are consolidatin' near structural support, and institutional whales are quietly accumulating. Watch the volume block spikes.`,
        `${activeSymbol} is down bad, giving boomer stagnation vibes. Negative retail sentiment on Twitter and RSI cooling off. Safe to avoid or scale out until structural demand returns.`
      ]
      const hash = activeSymbol.charCodeAt(0) % fallbacks.length
      setAiResponse(fallbacks[hash])
    } finally {
      setLoadingAi(false)
    }
  }

  // Whale block order book generator
  const whaleBlocks = useMemo(() => {
    let hash = 0
    for (let i = 0; i < activeSymbol.length; i++) {
      hash = activeSymbol.charCodeAt(i) + ((hash << 5) - hash)
    }
    const base = tradeTickerPrice
    return [
      { time: '17:34:10', type: 'BUY', qty: Math.abs((hash * 123) % 45000) + 5000, price: Math.round(base * 0.998 * 100) / 100 },
      { time: '17:28:45', type: 'SELL', qty: Math.abs((hash * 456) % 35000) + 4000, price: Math.round(base * 1.002 * 100) / 100 },
      { time: '17:15:12', type: 'BUY', qty: Math.abs((hash * 789) % 65000) + 8000, price: Math.round(base * 0.999 * 100) / 100 }
    ]
  }, [activeSymbol, tradeTickerPrice])

  // Rebalancing suggestion based on risk archetype
  const rebalancingGuardMsg = useMemo(() => {
    const guards = {
      'Slow Builder': "Exposure check: Slow Builder profile requires 70% blue-chip exposure. Your holdings look stable. Consider adding RELIANCE/HDFCBANK to defend against volatility.",
      'Optimizer': "Portfolio status: Balanced. Optimize returns by rotating 10% from slow-moving IT blocks into defense breakout plays like HAL.",
      'FOMO Trader': "WARNING: FOMO trader energy detected. High concentration in hypergrowth high-beta stocks. Consider shifting 15% to gold bees (GOLDBEES) to prevent portfolio drawdown.",
      'Thrill Chaser': "ALERT: Thrill Chaser profile. Leverage and microcap concentration are extremely high. Add defensive IT layers (INFY/TCS) to establish a baseline cushion."
    }
    return guards[riskArchetype] || "Portfolio allocation matches archetype. Maintain current position rules."
  }, [riskArchetype])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full min-h-screen relative pb-32 text-left bg-[#fcf9f8]"
    >
      {/* CSS custom overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        .doodle-border {
            border: 3px solid #1a1a1a;
            border-radius: 16px;
            box-shadow: 6px 6px 0px 0px rgba(26,26,26,1);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .doodle-border:hover {
            transform: translate(-2px, -2px) rotate(1deg);
            box-shadow: 8px 8px 0px 0px rgba(26,26,26,1);
        }
        .sticker-card {
            background-color: #ffffff;
            border: 3px solid #1a1a1a;
            border-radius: 16px;
            box-shadow: 6px 6px 0px 0px rgba(26,26,26,1);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .chunky-btn {
            background-color: #ffffff;
            color: #1a1a1a;
            border: 2px solid #1a1a1a;
            border-radius: 9999px;
            font-weight: bold;
            box-shadow: 4px 4px 0px 0px rgba(26,26,26,1);
            transition: all 0.1s;
        }
        .chunky-btn:active {
            transform: translate(4px, 4px);
            box-shadow: 0px 0px 0px 0px rgba(26,26,26,1);
        }
        @keyframes pulse-green {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .pulse-live {
            animation: pulse-green 1.5s infinite;
        }
        .dashed-divider {
            border-bottom: 3px dashed #1c1b1b;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}} />


      {/* Extended Ribbon Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-70">
        <svg className="absolute w-[150vw] h-[150vh] top-[-20vh] left-[-20vw]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1000 1000">
          <path d="M -100,200 C 300,400 400,600 1100,800" fill="none" stroke="#fd56a7" strokeLinecap="round" strokeWidth="60" />
          <path d="M -100,280 C 300,480 400,680 1100,880" fill="none" stroke="#7c3aed" strokeLinecap="round" strokeWidth="60" />
          <path d="M -100,360 C 300,560 400,760 1100,960" fill="none" stroke="#fde047" strokeLinecap="round" strokeWidth="60" />
        </svg>
      </div>

      {/* Connective Pipes Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <svg className="w-full h-full" fill="none" stroke="#1c1b1b" strokeWidth="3">
          <path d="M 250 200 C 350 200, 350 150, 400 150" strokeDasharray="8 8" />
          <path d="M 40vw 400 C 50vw 400, 50vw 500, 60vw 500" />
          <circle cx="60vw" cy="500" fill="#fcf9f8" r="6" stroke="#1c1b1b" strokeWidth="3" />
        </svg>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 mt-12 md:mt-4 space-y-10 relative z-10">
        
        {/* Dashboard Header */}
        <div className="flex items-end justify-between mb-8 relative md:pl-4 md:ml-2">
          <div className="relative">
            <h2 className="font-display text-6xl md:text-8xl text-[#1c1b1b] leading-none drop-shadow-[5px_5px_0px_#7dd3fc] relative z-10 select-none">
              War Room
            </h2>
            <p className="font-headline text-sm font-bold text-zinc-700 mt-3 bg-white px-4 py-1.5 border-2 border-black rounded-lg inline-block transform rotate-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none">
              Where the magic happens
            </p>
            
            {/* Header Doodles */}
            <div className="absolute -top-6 -left-6 z-0 animate-pulse-star">
              <svg fill="none" height="40" viewBox="0 0 40 40" width="40" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 0L23.5 16.5L40 20L23.5 23.5L20 40L16.5 23.5L0 20L16.5 16.5L20 0Z" fill="#fde047" stroke="#1c1b1b" strokeWidth="2"></path>
              </svg>
            </div>
            <div className="absolute top-2 -right-12 z-0 transform rotate-12">
              <svg fill="none" height="30" viewBox="0 0 30 40" width="30" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 0L30 20H20L25 40L0 15H15L15 0Z" fill="#ffb690" stroke="#1c1b1b" strokeWidth="2"></path>
              </svg>
            </div>
          </div>
          <div className="text-right text-[10px] text-zinc-500 font-mono hidden sm:block uppercase tracking-widest">
            SYSTEM ONLINE • LATENCY 12MS
          </div>
        </div>

        {/* Candlestick Chart */}
        <section className="relative z-10">
          <CandlestickChart 
            defaultSymbol={activeSymbol} 
            onSymbolChange={handleSymbolChange} 
          />
        </section>

        {/* 3-Column Split Grid */}
        <div className="flex flex-col lg:flex-row gap-8 relative z-10 lg:items-start">
          
          {/* Col 1: Live Signals */}
          <div className="flex flex-col gap-6 w-full lg:w-1/3">
            <div className="flex items-center gap-2 mb-2 bg-white self-start px-4 py-2 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transform -rotate-2 select-none">
              <span className="text-[#fd56a7] text-lg font-black animate-pulse">⚡</span>
              <h3 className="font-headline text-lg font-black text-[#1c1b1b]">Live Signals</h3>
            </div>

            {loadingSignals && liveSignals.length === 0 ? (
              <div className="doodle-border bg-white p-8 text-center text-zinc-500">
                <RefreshCw size={24} className="animate-spin mx-auto text-[#00d09c] mb-3" />
                <span className="text-xs font-bold font-mono">Streaming AI signals...</span>
              </div>
            ) : null}

            {liveSignals.map((sig, idx) => {
              // Alternate rotation angles for Stitch organic feel
              const rotations = ['rotate-2', '-rotate-1', 'rotate-1']
              const rotClass = rotations[idx % rotations.length]
              
              // Map dynamic variables to Stitch style tags
              const isLong = sig.signal_type === 'ACT'
              const isShort = sig.signal_type === 'NOISE'
              const badgeText = isLong ? 'LONG' : isShort ? 'SHORT' : 'WATCH'
              
              // Colors
              const badgeStyle = isLong 
                ? 'bg-[#ffdbca] text-[#783200]' 
                : isShort 
                  ? 'bg-[#ffcdd2] text-[#c62828]' 
                  : 'bg-[#eaddff] text-[#25005a]'

              const avatarBg = isLong ? 'bg-[#7c3aed]' : 'bg-[#fd56a7]'
              const barColor = isLong ? 'bg-[#fd56a7]' : 'bg-[#630ed4]'

              return (
                <div 
                  key={sig.ticker || idx}
                  onClick={() => handleSymbolChange(sig.ticker)}
                  className={`doodle-border bg-white p-5 cursor-pointer hover:scale-102 hover:bg-zinc-50 transition-all ${rotClass}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-full ${avatarBg} text-white flex items-center justify-center font-black text-sm border-2 border-black`}>
                        {isLong ? 'AI' : '★'}
                      </div>
                      <span className="font-bold text-base text-[#1c1b1b]">{isLong ? 'VibeBot Alpha' : 'Whale Watch'}</span>
                    </div>
                    <span className={`text-xs font-mono px-3 py-1 rounded-full border-2 border-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider ${badgeStyle}`}>
                      {badgeText}
                    </span>
                  </div>
                  <div className="mb-4 text-left">
                    <p className="font-display text-2xl m-0 text-[#1c1b1b]">
                      {sig.ticker}/INR
                    </p>
                    <p className="text-sm text-zinc-500 font-medium mt-1 italic">"{sig.reasoning}"</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-2 font-bold">
                      <span className="uppercase tracking-wider text-zinc-450">Confidence</span>
                      <span className="text-black font-black">{sig.confidence}%</span>
                    </div>
                    <div className="w-full bg-zinc-150 h-4 rounded-full border-2 border-black overflow-hidden relative p-0.5">
                      <div 
                        className={`h-full border-r-2 border-black rounded-full ${barColor}`}
                        style={{ width: `${sig.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Col 2: Vibe Picks */}
          <div className="flex flex-col gap-6 w-full lg:w-1/3 pt-4 lg:pt-12">
            <div className="flex items-center gap-2 mb-2 bg-white self-start px-4 py-2 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transform rotate-1 select-none">
              <span className="text-[#630ed4] text-lg font-bold">🎯</span>
              <h3 className="font-headline text-lg font-black text-[#1c1b1b]">Vibe Picks</h3>
              <button 
                onClick={() => setShowPicksInfo(prev => !prev)}
                className="ml-auto text-zinc-400 hover:text-black transition-colors"
                title="What are Vibe Picks?"
              >
                <HelpCircle size={14} />
              </button>
            </div>

            {showPicksInfo && (
              <div className="bg-sky-50 border-2 border-black rounded-2xl p-4 text-xs font-bold text-zinc-700 leading-relaxed shadow-[3px_3px_0px_#000] mb-2">
                <Info size={14} className="inline mr-1 text-sky-600 shrink-0" />
                <strong>Vibe Picks</strong> recommendations are dynamic, risk-profiled stocks pulled from the database for your archetype.
                <div className="mt-2 text-[10px] text-zinc-500 font-mono">
                  * Note: The mock placeholders <em>Project X</em> and <em>OldCoin</em> have been upgraded to live recommendations.
                </div>
              </div>
            )}

            {loadingPicks && vibePicks.length === 0 ? (
              <div className="sticker-card p-8 text-center text-zinc-400">
                <RefreshCw size={24} className="animate-spin mx-auto text-[#fd56a7] mb-3" />
                <span className="text-xs font-bold font-mono">Loading recommendations...</span>
              </div>
            ) : null}

            {vibePicks.map((pick, idx) => {
              const isBuy = pick.action === 'BUY'
              const isFirst = idx === 0
              
              if (isFirst) {
                return (
                  <div 
                    key={pick.ticker || idx}
                    onClick={() => handleSymbolChange(pick.ticker)}
                    className="sticker-card p-6 border-4 border-secondary-container relative overflow-hidden transform -rotate-2 cursor-pointer hover:scale-102 hover:bg-zinc-50 transition-all bg-white"
                  >
                    {/* Decorative background circle */}
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#ffd9e4] rounded-full opacity-50 z-0 border-4 border-dashed border-[#b4136d]" />
                    
                    <div className="relative z-10 text-left">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h4 className="font-display text-3xl m-0 text-black">{pick.ticker}</h4>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase leading-none mt-1">{pick.name || 'Equity Stock'}</p>
                        </div>
                        <span className="bg-[#c8e6c9] text-[#2e7d32] border-2 border-black px-4 py-1.5 rounded-full font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform rotate-6">
                          {pick.action || 'BUY'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mb-6 bg-white p-4 rounded-xl border-2 border-black shadow-inner">
                        <div className="text-center">
                          <p className="text-[10px] uppercase font-bold text-zinc-400">Price</p>
                          <p className="font-mono font-bold text-sm text-[#1c1b1b]">₹{Math.round(pick.price || 150).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="text-center border-l-2 border-r-2 border-black border-dashed">
                          <p className="text-[10px] uppercase font-bold text-zinc-400">Target</p>
                          <p className="font-mono font-bold text-sm text-secondary-container">₹{Math.round(pick.target || pick.price * 1.25).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] uppercase font-bold text-zinc-400">Stop</p>
                          <p className="font-mono font-bold text-sm text-rose-600">₹{Math.round(pick.stop_loss || pick.price * 0.9).toLocaleString('en-IN')}</p>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-500 font-bold mb-4 line-clamp-2 leading-relaxed bg-zinc-50 p-2.5 border border-zinc-200 rounded">
                        {pick.reasoning || (pick.thesis && pick.thesis[0]) || 'AI recommended target setup.'}
                      </p>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTradeOnGroww(pick.ticker)
                        }}
                        className="w-full bg-[#630ed4] text-white border-2 border-black rounded-xl py-4 font-bold flex justify-center items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-1 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] text-lg cursor-pointer"
                      >
                        Trade on Groww
                        <span>➔</span>
                      </button>
                    </div>
                  </div>
                )
              } else {
                return (
                  <div 
                    key={pick.ticker || idx}
                    onClick={() => handleSymbolChange(pick.ticker)}
                    className="sticker-card p-6 relative overflow-hidden transform rotate-3 cursor-pointer hover:scale-102 hover:bg-zinc-50 transition-all bg-white border-3 border-black shadow-[6px_6px_0px_rgba(26,26,26,1)]"
                  >
                    <div className="relative z-10 text-left">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h4 className="font-display text-3xl m-0 text-black">{pick.ticker}</h4>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase leading-none mt-1">{pick.name || 'Equity Stock'}</p>
                        </div>
                        <span className={`border-2 border-black px-4 py-1.5 rounded-full font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform -rotate-6
                          ${isBuy ? 'bg-[#c8e6c9] text-[#2e7d32]' : 'bg-[#ffcdd2] text-[#c62828]'}
                        `}>
                          {pick.action || 'AVOID'}
                        </span>
                      </div>
                      <p className="text-sm mb-4 text-[#1c1b1b] font-medium bg-zinc-50 p-3 rounded-lg border-2 border-black border-dashed">
                        {pick.reasoning || (pick.thesis && pick.thesis[0]) || 'AI flagged this setup under current indicators.'}
                      </p>
                    </div>
                  </div>
                )
              }
            })}
          </div>

          {/* Col 3: Your Bag */}
          <div className="flex flex-col gap-6 w-full lg:w-1/3 pt-8 lg:pt-0">
            <div className="flex items-center gap-2 mb-2 bg-white self-start px-4 py-2 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transform -rotate-3 select-none">
              <span className="text-[#ff9800] text-lg font-bold">💼</span>
              <h3 className="font-headline text-lg font-black text-[#1c1b1b]">Your Bag</h3>
            </div>

            <div className="doodle-border bg-white p-8 text-center relative overflow-hidden">
              {/* Floating Star icons */}
              <span className="absolute top-4 left-4 text-[#fd56a7] opacity-40 animate-pulse text-3xl select-none">★</span>
              <span className="absolute top-12 right-6 text-[#630ed4] opacity-30 rotate-12 text-4xl select-none">★</span>
              <span className="absolute bottom-24 left-8 text-[#ffb690] opacity-40 -rotate-12 text-2xl select-none">★</span>
              
              {/* Tape Detail */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 rotate-2 w-24 h-8 bg-white/50 backdrop-blur-xs border border-zinc-200 shadow-sm z-20" />

              {/* SVG Donut Chart */}
              <div className="relative w-48 h-48 mx-auto mb-8">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]" viewBox="0 0 100 100">
                  {donutSlices.length === 0 ? (
                    <circle cx="50" cy="50" fill="transparent" r="35" stroke="#e5e2e1" strokeWidth="24" />
                  ) : (
                    donutSlices.map((slice, i) => (
                      <circle 
                        key={i}
                        cx="50" 
                        cy="50" 
                        fill="transparent" 
                        r="35" 
                        stroke={slice.color} 
                        strokeDasharray={slice.dash} 
                        strokeDashoffset={slice.offset} 
                        strokeWidth="24" 
                      />
                    ))
                  )}
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full m-8 border-4 border-black shadow-[inset_4px_4px_0px_rgba(0,0,0,0.1)]">
                  <span className="text-[12px] font-bold uppercase tracking-widest text-zinc-400">Total</span>
                  <span className={`font-mono font-bold text-lg ${totalPnl >= 0 ? 'text-[#2e7d32]' : 'text-rose-600'}`}>
                    {totalPnl >= 0 ? '+' : ''}{totalPnlPct}%
                  </span>
                </div>
              </div>

              {/* Price Sticker */}
              <div className="bg-[#fde047] inline-block px-4 py-2 border-4 border-black rounded-2xl transform rotate-2 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] mb-4 relative z-10">
                <h4 className="font-display text-4xl md:text-5xl text-[#1c1b1b] mb-0">₹{totalValue.toLocaleString('en-IN')}</h4>
              </div>
              <p className="text-base font-bold text-secondary-container leading-none mb-6">
                {holdings.length === 0 ? "Demat is empty! Trade below to start." : "Look at you go! 🚀"}
              </p>

              {/* Asset List */}
              {holdings.length === 0 ? (
                <div className="mt-6 p-4 border-2 border-black border-dashed rounded-xl bg-zinc-50 text-xs font-bold text-zinc-500">
                  No active holdings. Add trades below or link Groww on the Portfolio page.
                </div>
              ) : (
                <div className="mt-6 space-y-4 text-left border-t-2 border-zinc-150 pt-6 max-h-[380px] overflow-y-auto no-scrollbar px-4 -mx-4">
                  {holdings.map((h, i) => {
                    const val = h.quantity * (h.current_price || h.avg_buy_price)
                    const isUp = h.pnl >= 0
                    const rot = i % 2 === 0 ? '-rotate-1' : 'rotate-1'
                    
                    // Simple path for dynamic sparkline
                    const sparklinePath = isUp 
                      ? 'M0 25 Q 20 5, 40 20 T 80 10 T 100 5' 
                      : 'M0 5 Q 20 25, 40 10 T 80 20 T 100 25'
                    const sparklineColor = isUp ? '#2e7d32' : '#c62828'
                    
                    return (
                      <div 
                        key={h.id || i}
                        onClick={() => handleSymbolChange(h.ticker)}
                        className={`bg-white p-4 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] flex flex-col gap-2 hover:rotate-0 transition-transform cursor-pointer ${rot}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#eaddff] border-2 border-black flex items-center justify-center text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[#25005a]">
                              {h.ticker[0]}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-base leading-none text-[#1c1b1b]">{h.ticker}</span>
                              <span className="font-mono text-xs text-zinc-400 mt-1">{h.quantity} units</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold text-base text-[#1c1b1b]">₹{Math.round(val).toLocaleString('en-IN')}</p>
                            <p className={`text-xs font-bold ${isUp ? 'text-[#2e7d32] bg-[#c8e6c9]' : 'text-[#c62828] bg-[#ffcdd2]'} px-2 py-0.5 rounded border border-black inline-block mt-1`}>
                              {isUp ? '+' : ''}{h.pnl_percentage ? h.pnl_percentage.toFixed(1) : '0.0'}%
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="w-24 h-8 opacity-70">
                            <svg className="w-full h-full" viewBox="0 0 100 30">
                              <path 
                                d={sparklinePath} 
                                fill="none" 
                                stroke={sparklineColor} 
                                strokeLinecap="round" 
                                strokeWidth="3" 
                              />
                            </svg>
                          </div>
                          <button 
                            type="button"
                            onClick={(e) => handleSellHolding(e, h.id, h.ticker)}
                            className="text-xs font-bold text-white bg-[#630ed4] px-4 py-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#7c3aed] transition-colors cursor-pointer"
                          >
                            Sell
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tactical Execution Console */}
        <section className="relative z-10 bg-white border-3 border-black rounded-3xl p-6 md:p-8 shadow-[6px_6px_0px_#1c1b1b]">
          <div className="flex items-center gap-3 mb-6 border-b-3 border-black pb-4">
            <div className="w-10 h-10 bg-[#fde047] border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <TrendingUp size={18} className="text-black" />
            </div>
            <div>
              <h3 className="font-display text-2xl md:text-3xl text-black uppercase tracking-tight m-0">Tactical Execution Console</h3>
              <p className="text-xs text-zinc-500 font-bold mt-0.5 border-l-4 border-[#fd56a7] pl-2">Submit mock demat orders and check AI sentiment checkups instantly.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
            
            {/* Decorative pipe connector between columns */}
            <div className="hidden lg:block absolute z-0 pointer-events-none" style={{ left: 'calc(58.333% - 2rem)', top: '80px' }}>
              <div className="w-24 h-14 border-t-4 border-r-4 border-black rounded-tr-3xl" />
            </div>

            {/* Col 1: Quick Trade Ticket */}
            <div
              className="lg:col-span-7 bg-white border-3 border-black rounded-2xl p-6 md:p-8 shadow-[6px_6px_0px_#1c1b1b] relative z-10 flex flex-col gap-6"
              style={{ backgroundImage: 'radial-gradient(#ccc3d8 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' }}
            >
              {/* Card header */}
              <div className="flex items-center justify-between border-b-4 border-dashed border-zinc-300 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#fd56a7] text-white p-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_#1c1b1b]">
                    <Landmark size={18} className="text-white" />
                  </div>
                  <h3 className="font-display text-xl md:text-2xl uppercase tracking-tight text-black">Quick Trade Ticket</h3>
                </div>
              </div>

              {/* Stock Ticker + Execution Mode selects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] font-black text-zinc-500 uppercase tracking-widest">Stock Ticker</label>
                  <div className="relative">
                    <select
                      value={tradeTicker}
                      onChange={(e) => setTradeTicker(e.target.value)}
                      className="w-full appearance-none bg-white p-4 pr-10 rounded-xl border-3 border-black font-headline font-bold text-lg focus:outline-none focus:ring-4 focus:ring-[#eaddff] shadow-[3px_3px_0px_#1c1b1b] hover:bg-zinc-50 transition-all cursor-pointer"
                    >
                      {[
                        'ZOMATO','TITAN','ADANIPORTS','TATASTEEL','INFY','RELIANCE',
                        'TCS','PAYTM','HAL','HDFCBANK','ICICIBANK','ITC','SBIN',
                        'BHARTIARTL','LTIM','MARUTI','TATACHEM','JIOFIN','IREDA','RVNL'
                      ].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-black text-sm">▾</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] font-black text-zinc-500 uppercase tracking-widest">Execution Mode</label>
                  <div className="relative">
                    <select
                      value={tradeAccount}
                      onChange={(e) => setTradeAccount(e.target.value)}
                      disabled={!isGrowwConnected}
                      className={`w-full appearance-none bg-white p-4 pr-10 rounded-xl border-3 border-black font-headline font-bold text-lg focus:outline-none focus:ring-4 focus:ring-[#eaddff] shadow-[3px_3px_0px_#1c1b1b] hover:bg-zinc-50 transition-all cursor-pointer ${!isGrowwConnected ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <option value="paper">Paper Trading</option>
                      {isGrowwConnected && <option value="groww">Groww Demat</option>}
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-black text-sm">▾</span>
                  </div>
                  {!isGrowwConnected && (
                    <span className="text-[8px] text-zinc-500 font-bold ml-1">Connect Groww on Portfolio to unlock live demat trades.</span>
                  )}
                </div>
              </div>

              {/* BUY / SELL Toggle */}
              <div className="flex rounded-xl overflow-hidden border-3 border-black shadow-[3px_3px_0px_#1c1b1b]">
                <button
                  type="button"
                  onClick={() => setTradeType('BUY')}
                  className={`flex-1 py-4 font-display font-black text-xl transition-all uppercase cursor-pointer border-r-3 border-black
                    ${tradeType === 'BUY' ? 'bg-[#c8e6c9] text-emerald-950' : 'bg-white text-zinc-500 hover:bg-zinc-50'}
                  `}
                >
                  BUY ORDER
                </button>
                <button
                  type="button"
                  onClick={() => setTradeType('SELL')}
                  className={`flex-1 py-4 font-display font-black text-xl transition-all uppercase cursor-pointer
                    ${tradeType === 'SELL' ? 'bg-[#ffcdd2] text-rose-950' : 'bg-white text-zinc-500 hover:bg-zinc-50'}
                  `}
                >
                  SELL ORDER
                </button>
              </div>

              {/* Quantity */}
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] font-black text-zinc-500 uppercase tracking-widest">Quantity (Shares)</label>
                <input
                  type="number"
                  min="1"
                  value={tradeQuantity}
                  onChange={(e) => setTradeQuantity(parseInt(e.target.value) || 1)}
                  className="w-full bg-white p-4 rounded-xl border-3 border-black font-mono font-black text-xl focus:outline-none focus:ring-4 focus:ring-[#eaddff] shadow-[3px_3px_0px_#1c1b1b] transition-all"
                />
              </div>

              {/* Pricing Breakdown */}
              <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_#1c1b1b] flex flex-col gap-2 font-mono text-sm">
                <div className="flex justify-between text-zinc-500">
                  <span>Market Price:</span>
                  <span className="font-bold text-black">₹{tradeTickerPrice}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Brokerage (0.05%):</span>
                  <span className="font-bold text-black">₹{(tradeQuantity * tradeTickerPrice * 0.0005).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t-2 border-dashed border-zinc-200 pt-2 text-base">
                  <span className="font-black text-black">Total Cost:</span>
                  <span className="font-black text-[#630ed4]">₹{Math.round(tradeQuantity * tradeTickerPrice * 1.0005).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Success message */}
              {tradeSuccess && (
                <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-3 text-xs text-emerald-800 font-bold flex items-center gap-2">
                  <BadgeCheck size={16} className="text-emerald-600 shrink-0" />
                  <span>{tradeSuccessMsg}</span>
                </div>
              )}

              {/* Submit CTA */}
              <button
                onClick={handleExecuteTrade}
                disabled={executingTrade}
                className="w-full bg-[#fd56a7] hover:bg-pink-500 text-white border-3 border-black rounded-xl py-5 font-display font-black text-xl md:text-2xl uppercase shadow-[4px_4px_0px_#1c1b1b] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1c1b1b] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex justify-center items-center gap-3 mt-2"
              >
                {executingTrade ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Executing Order...</span>
                  </>
                ) : (
                  <>
                    <span>Submit {tradeType} Order</span>
                    <Sparkles size={20} />
                  </>
                )}
              </button>
            </div>

            {/* Col 2: AI Vibe Telemetry */}
            <div className="lg:col-span-5 flex flex-col gap-6 relative z-10 mt-4 lg:mt-0">
              
              {/* Telemetry Card */}
              <div className="bg-white border-3 border-black rounded-2xl p-6 shadow-[5px_5px_0px_#1c1b1b] flex flex-col gap-5">
                <div className="flex items-center justify-between border-b-4 border-black pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-black text-white p-2 rounded-lg border-2 border-black">
                      <TrendingUp size={16} className="text-[#00d09c]" />
                    </div>
                    <h3 className="font-display text-lg uppercase tracking-tight text-black">{activeSymbol} Telemetry</h3>
                  </div>
                  <span className="border-2 border-black px-2 py-1 rounded-lg text-[9px] font-black uppercase bg-zinc-100 shadow-[1px_1px_0px_#1c1b1b]">Live</span>
                </div>

                {/* Sentiment Gauge */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between font-mono text-[10px] font-black text-zinc-500 uppercase">
                    <span>Retail Sentiment</span>
                    <span className="text-[#2e7d32]">78% Bullish</span>
                  </div>
                  <div className="h-6 w-full border-2 border-black rounded-full overflow-hidden flex shadow-[2px_2px_0px_#1c1b1b]">
                    <div className="h-full bg-[#630ed4]" style={{ width: '78%' }} />
                    <div className="h-full bg-[#fd56a7] border-l-2 border-black" style={{ width: '22%' }} />
                  </div>
                </div>

                {/* AI Vibe Check card */}
                <div className="bg-[#fcf9f8] border-2 border-dashed border-black rounded-xl p-4 min-h-[90px] flex flex-col items-center justify-center gap-3 text-center">
                  {loadingAi ? (
                    <div className="text-center text-zinc-400">
                      <RefreshCw size={18} className="animate-spin mx-auto text-[#630ed4] mb-2" />
                      <span className="text-[10px] font-bold font-mono">VibeBot is reading SEBI filings & Reddit...</span>
                    </div>
                  ) : aiResponse ? (
                    <div className="text-xs font-bold text-zinc-700 leading-relaxed text-left flex items-start gap-2">
                      <Sparkles size={16} className="text-[#630ed4] shrink-0 mt-0.5" />
                      <p className="italic">"{aiResponse}"</p>
                    </div>
                  ) : (
                    <>
                      <p className="font-sans text-sm font-bold text-zinc-600">Want a quick AI analysis on {activeSymbol}?</p>
                      <button
                        onClick={handleAiVibeCheck}
                        className="bg-black hover:bg-zinc-800 text-white border-2 border-black rounded-full px-5 py-2 font-bold text-sm shadow-[3px_3px_0px_#fd56a7] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center gap-2"
                      >
                        Ask VibeBot (AI Check)
                        <Sparkles size={14} className="text-[#fd56a7]" />
                      </button>
                    </>
                  )}
                </div>

                {/* Whale Block Trades */}
                <div>
                  <h4 className="font-mono text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3">Live Whale Block Trades</h4>
                  <div className="flex flex-col gap-0 font-mono text-xs border-2 border-black rounded-xl overflow-hidden shadow-[2px_2px_0px_#1c1b1b]">
                    {whaleBlocks.map((block, idx) => (
                      <div
                        key={idx}
                        className={`flex justify-between items-center px-3 py-2.5 ${idx < whaleBlocks.length - 1 ? 'border-b-2 border-black' : ''} ${idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}`}
                      >
                        <span className="text-zinc-400 text-[10px]">{block.time}</span>
                        <span className={`font-black uppercase text-[11px] ${block.type === 'BUY' ? 'text-[#2e7d32]' : 'text-[#c62828]'}`}>
                          {block.type}
                        </span>
                        <span className="font-bold text-black text-[10px]">{block.qty.toLocaleString()} units</span>
                        <span className="font-black text-[#630ed4] text-[10px]">₹{block.price.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Archetype Guard Banner */}
              <div className="bg-[#eaddff] border-3 border-black rounded-2xl p-5 shadow-[5px_5px_0px_#1c1b1b] flex items-start gap-3">
                <AlertCircle size={20} className="text-[#630ed4] shrink-0 mt-0.5" />
                <div className="text-sm text-zinc-700 leading-relaxed font-bold">
                  <span className="text-[#630ed4] font-black uppercase">{riskArchetype} Rule: </span>
                  {rebalancingGuardMsg}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Collapsible Whale Activity & Sector Pulse Panels */}
        <div className="flex flex-col gap-8 relative z-10 w-full">
               <div className="sticker-card bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[6px_6px_0px_#1c1b1b] rotation-1">
            <button 
              type="button"
              onClick={() => setWhalePanelOpen(!whalePanelOpen)}
              className="w-full flex justify-between items-center p-5 bg-[#faf7f2] hover:bg-zinc-100 transition-colors border-b-4 border-black font-display font-black text-xl uppercase text-black cursor-pointer text-left focus:outline-none"
            >
              <span className="flex items-center gap-2">
                <span className="bg-green-500 w-3.5 h-3.5 rounded-full pulse-live border-2 border-black inline-block"></span>
                🐳 WHALE ACTIVITY
              </span>
              <span className="font-mono text-xl">{whalePanelOpen ? '▲' : '▼'}</span>
            </button>
            
            {whalePanelOpen && (
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center mb-6 pb-4 border-b-3 border-dashed border-black">
                  <span className="font-headline text-sm font-bold text-zinc-500">Live Stream Broadcast</span>
                  <div className="font-mono bg-black text-white px-4 py-1.5 rounded-full text-[9px] font-bold">FEED_SYNC: OK</div>
                </div>

                <div className="space-y-5 max-h-[600px] overflow-y-auto no-scrollbar pt-4 pb-4 px-3 -mx-3">
                  {whaleTrades.map((t, idx) => {
                    const isBuy = t.side === 'BUY'
                    const rotation = idx % 2 === 0 ? 'rotate-[0.5deg]' : '-rotate-[0.5deg]'
                    const shadowColor = isBuy ? 'shadow-[2px_2px_0px_#fd56a7]' : 'shadow-[2px_2px_0px_#7c3aed]'
                    
                    return (
                      <div 
                        key={idx}
                        className={`p-5 border-3 border-black rounded-2xl bg-white shadow-[4px_4px_0px_0px_#1c1b1b] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1c1b1b] ${rotation}`}
                      >
                        {/* Left Section: Time, Side & Ticker */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="font-mono text-zinc-400 text-[10px] bg-[#fcf9f8] border border-zinc-200 px-2.5 py-1 rounded-md font-bold">
                            {t.time}
                          </div>
                          
                          <span className={`text-[10px] font-black uppercase border-2 border-black px-3 py-1 rounded-lg shadow-[2px_2px_0px_black] flex items-center gap-1
                            ${isBuy ? 'bg-[#c8e6c9] text-[#2e7d32]' : 'bg-[#ffcdd2] text-[#c62828]'}
                          `}>
                            {t.side} {isBuy ? '🟢' : '🔴'}
                          </span>

                          <span className={`bg-black text-white font-mono px-3.5 py-1.5 rounded-xl text-xs border-2 border-black ${isBuy ? 'shadow-[2px_2px_0px_#fd56a7]' : 'shadow-[2px_2px_0px_#7c3aed]'} uppercase tracking-wide font-black`}>
                            {t.ticker}
                          </span>
                        </div>

                        {/* Middle Section: Aurex Take / AI Commentary */}
                        <div className="flex-1 md:border-l-2 md:border-dashed md:border-zinc-300 md:pl-6 text-left">
                          <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 p-3 rounded-xl">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Aurex Telemetry Take</span>
                            <p className="text-xs font-semibold text-zinc-700 italic leading-relaxed">
                              "{t.aurex_take}"
                            </p>
                          </div>
                        </div>

                        {/* Right Section: Transaction Value */}
                        <div className="shrink-0 text-right">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Position Value</span>
                          <div className="bg-[#fde047] border-3 border-black text-[#1c1b1b] px-4 py-2 rounded-xl font-mono font-black text-sm shadow-[3px_3px_0px_black] inline-block uppercase">
                            ₹{t.value_cr} Cr
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {whaleTrades.length === 0 && (
                    <div className="py-12 text-center text-xs font-bold text-zinc-450 font-mono border-2 border-dashed border-black rounded-2xl bg-zinc-50">
                      Waiting for whale trades SSE broadcast...
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setActivePage('whale-tracker')}
                    className="flex items-center gap-1.5 py-2.5 px-5 border-3 border-black rounded-xl bg-white hover:bg-zinc-50 font-black text-xs uppercase shadow-[3px_3px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                  >
                    <span>View All Whales</span>
                    <span>🐳 ➔</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Panel 2: SECTOR PULSE */}
          <div className="sticker-card bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[6px_6px_0px_#1c1b1b] rotation-neg-1">
            <button 
              type="button"
              onClick={() => setSectorPanelOpen(!sectorPanelOpen)}
              className="w-full flex justify-between items-center p-5 bg-[#eafbf7] hover:bg-[#d5f7ed] transition-colors border-b-4 border-black font-display font-black text-lg uppercase text-black cursor-pointer text-left focus:outline-none"
            >
              <span className="flex items-center gap-2">📊 SECTOR PULSE</span>
              <span className="font-mono text-xl">{sectorPanelOpen ? '▲' : '▼'}</span>
            </button>
            
            {sectorPanelOpen && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {sectorHeatmap.map((s, idx) => {
                    const isUp = s.weekly_change >= 0
                    
                    // Accent border top colors (cyber-violet, pink, or red)
                    const borderClass = isUp 
                      ? (idx % 2 === 0 ? 'border-t-8 border-[#7c3aed]' : 'border-t-8 border-[#fd56a7]') 
                      : 'border-t-8 border-[#ef4444]'
                    
                    // Themed card backgrounds (light purple, light pink, or light red)
                    const cardBg = isUp
                      ? (idx % 2 === 0 ? 'bg-[#f3e8ff]' : 'bg-[#fce7f3]')
                      : 'bg-[#fee2e2]'

                    // Themed solid vibe badges
                    const vibeBadgeClass = isUp
                      ? 'bg-[#c8e6c9] text-[#2e7d32] border-2 border-black shadow-[1px_1px_0px_black]'
                      : 'bg-[#ffcdd2] text-[#c62828] border-2 border-black shadow-[1px_1px_0px_black]'

                    const vibeText = s.weekly_change >= 2.0 
                      ? 'VIBE: HIGH 🔥' 
                      : s.weekly_change >= 0.0 
                        ? 'VIBE: STABLE ✨' 
                        : 'VIBE: HARSH 💀'

                    return (
                      <div 
                        key={idx} 
                        className={`p-5 border-3 border-black rounded-2xl ${cardBg} ${borderClass} shadow-[4px_4px_0px_0px_rgba(28,27,27,1)] flex flex-col justify-between text-left transition-all hover:scale-102 hover:shadow-[6px_6px_0px_0px_rgba(28,27,27,1)]`}
                      >
                        <div>
                          <div className="font-mono text-[10px] uppercase mb-1 text-zinc-500 tracking-wider font-bold">{s.name}</div>
                          <div className={`text-2xl font-display font-extrabold tracking-tight ${isUp ? 'text-[#2e7d32]' : 'text-[#c62828]'}`}>
                            {isUp ? '+' : ''}{s.weekly_change}%
                          </div>
                        </div>
                        
                        <div className="mt-5 space-y-2">
                          <div className={`text-[9px] font-black inline-block px-2.5 py-0.5 rounded-md ${vibeBadgeClass} uppercase font-mono tracking-wider`}>
                            {vibeText}
                          </div>
                          <div className="text-[10px] font-bold text-zinc-550 font-sans block">
                            TOP: <span className="font-mono bg-white px-2 py-0.5 rounded border border-zinc-200 text-[#1c1b1b] font-black">{s.top_stock}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {sectorHeatmap.length === 0 && (
                    <div className="col-span-full py-6 text-center text-xs font-bold text-zinc-450 font-mono">
                      Loading sector pulse metrics...
                    </div>
                  )}
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setActivePage('sector-pulse')}
                    className="flex items-center gap-1.5 py-2.5 px-5 border-3 border-black rounded-xl bg-white hover:bg-zinc-50 font-black text-xs uppercase shadow-[3px_3px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                  >
                    <span>View All Sectors</span>
                    <span>📊 ➔</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>



      </div>


    </motion.div>
  )
}

export default WarRoom
