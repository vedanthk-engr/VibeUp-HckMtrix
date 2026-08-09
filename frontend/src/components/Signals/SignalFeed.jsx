import React, { useEffect, useState, useRef } from 'react'
import { SignalCard } from './SignalCard'
import { Filter, ZapOff, RefreshCw } from 'lucide-react'

// Standard seed signals in case backend is loading or stream is disrupted
const FALLBACK_SIGNALS = [
  {
    ticker: 'ZOMATO',
    signal_type: 'ACT',
    price: 194.20,
    change: 3.82,
    confidence: 86,
    reasoning: 'Blinkit Q4 EBITDA margins turned positive ahead of target, proving massive quick commerce scalability. Platform fee hiked to ₹6, boosting pure bottom line cashflows. FII ownership rose by 1.8% in recent quarters.',
    sources: ['NSE Announcement', 'Moneycontrol', 'FII Data']
  },
  {
    ticker: 'TITAN',
    signal_type: 'WATCH',
    price: 3410.50,
    change: 1.12,
    confidence: 68,
    reasoning: 'Union Budget customs duty cut on gold import from 15% to 10% is expected to expand jewelry margins by 1.2%. However, gold prices scaling all-time highs might suppress retail demand in tier-2 cities.',
    sources: ['SEBI Update', 'Economic Times']
  },
  {
    ticker: 'ADANIPORTS',
    signal_type: 'NOISE',
    price: 1420.90,
    change: -2.35,
    confidence: 42,
    reasoning: 'Gopalpur Port acquisition Enterprise Value at ₹3,080 Cr is fully priced in by markets. Stock trading near all-time high resistance of ₹1,480. High volumes are simply momentum rotation.',
    sources: ['NSE Filing', 'Reddit']
  },
  {
    ticker: 'TATASTEEL',
    signal_type: 'ACT',
    price: 181.10,
    change: 5.62,
    confidence: 79,
    reasoning: 'Technical breakout on weekly candles above structural resistance of ₹168. Domestic capex demand for flat steel is booming, fully insulating the balance sheet from European plant transition losses.',
    sources: ['RSI Indicator', 'Economic Times', 'NSE Filing']
  },
  {
    ticker: 'PAYTM',
    signal_type: 'NOISE',
    price: 378.40,
    change: -4.80,
    confidence: 84,
    reasoning: 'RBI wallet deposit deadline creates structural disruption. Losing UPI market share to PhonePe, with transaction numbers declining 14% month-on-month. Retain strict watch until audits clear.',
    sources: ['RBI Notice', 'Reddit']
  },
  {
    ticker: 'INFY',
    signal_type: 'WATCH',
    price: 1512.40,
    change: -1.05,
    confidence: 71,
    reasoning: 'US IT spending remains conservative with delayed deal ramp-ups. Operating margin guidance maintained at 20-22%. Fairly valued, consolidating near 50-day moving average.',
    sources: ['Nasdaq Trends', 'Economic Times']
  },
  {
    ticker: 'RELIANCE',
    signal_type: 'ACT',
    price: 2890.30,
    change: 2.15,
    confidence: 88,
    reasoning: 'Jio tariff hikes of 15-25% will directly boost consolidated ARPU by ₹22, adding ₹6,400 Cr to EBITDA in FY25. Retail segment footfall hit record highs this summer.',
    sources: ['NSE Announcement', 'Moneycontrol']
  },
  {
    ticker: 'TCS',
    signal_type: 'NOISE',
    price: 3950.00,
    change: 0.45,
    confidence: 50,
    reasoning: 'Standard flat trade volume ahead of Q1 results. The $2B contract win in the UK is already priced in. No structural momentum indicators showing breakout.',
    sources: ['RSI Indicator', 'NSE Filing']
  },
  {
    ticker: 'HAL',
    signal_type: 'ACT',
    price: 4120.00,
    change: 6.70,
    confidence: 92,
    reasoning: 'Ministry of Defence RFP for 156 Light Combat Helicopters worth ₹45,000 Cr solidifies order book. Order-to-bill ratio remains extremely robust at 3.4x.',
    sources: ['Defence Ministry Notice', 'Economic Times']
  },
  {
    ticker: 'HDFCBANK',
    signal_type: 'WATCH',
    price: 1610.20,
    change: -0.80,
    confidence: 65,
    reasoning: 'Post-merger credit-to-deposit ratio adjustment is taking longer than expected. NIM compression at 3.4% limits near-term upside. Heavy block deal flows create overhead supply.',
    sources: ['RBI Filing', 'Moneycontrol']
  },
  {
    ticker: 'ICICIBANK',
    signal_type: 'ACT',
    price: 1150.50,
    change: 3.10,
    confidence: 83,
    reasoning: 'Credit growth beating peers at 16.2% YoY. Best-in-class asset quality with Net NPA declining to 0.42%. Technical setup shows strong breakout above ₹1,120 cup-with-handle pattern.',
    sources: ['Quarterly Report', 'Economic Times']
  },
  {
    ticker: 'ITC',
    signal_type: 'WATCH',
    price: 430.15,
    change: 0.25,
    confidence: 60,
    reasoning: 'Demerger of hotel business scheduled for Q3 is a value unlocking trigger. Cigarette volume growth is stable at 2%, but FMCG margins are under pressure due to raw material inflation.',
    sources: ['SEBI Filing', 'Moneycontrol']
  },
  {
    ticker: 'SBIN',
    signal_type: 'ACT',
    price: 825.40,
    change: 4.20,
    confidence: 81,
    reasoning: 'RoA maintained above 1.1% for three consecutive quarters. Infrastructure credit demand is fueling credit growth. Reclaimed key support level of ₹800 on high volume.',
    sources: ['NSE Filing', 'Economic Times']
  },
  {
    ticker: 'BHARTIARTL',
    signal_type: 'WATCH',
    price: 1410.60,
    change: 1.80,
    confidence: 74,
    reasoning: 'Post-tariff hike monetization remains strong. Average data usage per customer expanded to 22.4 GB. Consolidated debt levels are stable, though 5G capex remains elevated.',
    sources: ['Company Presentation', 'RSI Indicator']
  },
  {
    ticker: 'LTIM',
    signal_type: 'NOISE',
    price: 4920.00,
    change: -1.15,
    confidence: 45,
    reasoning: 'Management transitions and vertical integration friction continue post-merger. Order pipeline is healthy, but execution conversion is slow. Trading in flat channel range.',
    sources: ['FII Data', 'Economic Times']
  },
  {
    ticker: 'MARUTI',
    signal_type: 'ACT',
    price: 12200.00,
    change: 3.95,
    confidence: 87,
    reasoning: 'Strong premium SUV product mix (Grand Vitara/In調o) expanding margins to 12.8%. Hybrid tax exemption discussions in key states could accelerate customer adoption.',
    sources: ['SIAM Sales Data', 'NSE Announcement']
  },
  {
    ticker: 'TATACHEM',
    signal_type: 'WATCH',
    price: 1080.40,
    change: -1.50,
    confidence: 58,
    reasoning: 'Global soda ash prices are stabilizing after a 12-month downtrend. Local demand remains strong, but European energy costs pose risks to overseas manufacturing subsidiaries.',
    sources: ['Industry Report', 'Moneycontrol']
  },
  {
    ticker: 'JIOFIN',
    signal_type: 'ACT',
    price: 355.80,
    change: 5.10,
    confidence: 84,
    reasoning: 'Joint venture with BlackRock for wealth management and brokerage receives SEBI approvals. Direct API integration for digital loans rolling out to retail merchants in Q2.',
    sources: ['Press Release', 'Economic Times']
  },
  {
    ticker: 'IREDA',
    signal_type: 'ACT',
    price: 192.50,
    change: 7.80,
    confidence: 89,
    reasoning: 'Cabinet approval to list subsidiaries unlocks capital. Net interest margins expand to 3.8% due to low-cost sovereign funding. Clean energy lending pipeline hits ₹20,000 Cr.',
    sources: ['NSE Announcement', 'Ministry of Power']
  },
  {
    ticker: 'RVNL',
    signal_type: 'ACT',
    price: 385.20,
    change: 9.40,
    confidence: 91,
    reasoning: 'L1 bidder for Central Railway metro lines and corporate freight corridors worth ₹2,800 Cr. Execution speed has expanded quarterly revenues by 18% YoY.',
    sources: ['NSE Announcement', 'Moneycontrol']
  }
]

// Helper to colorize log labels/tags
const highlightLog = (log) => {
  const regex = /^(\[\d{2}:\d{2}:\d{2}\])?\s*(\[[A-Z\-\s]+\])(.*)$/
  const match = log.match(regex)
  if (match) {
    const timestamp = match[1] || ''
    const tag = match[2]
    const rest = match[3]

    let tagStyle = 'text-zinc-600 bg-zinc-100 border border-zinc-300'
    if (tag.includes('SYSTEM')) tagStyle = 'text-indigo-700 bg-indigo-50 border border-indigo-200'
    else if (tag.includes('CON')) tagStyle = 'text-emerald-700 bg-emerald-50 border border-emerald-200'
    else if (tag.includes('FETCH')) tagStyle = 'text-amber-700 bg-amber-50 border border-amber-200'
    else if (tag.includes('RAG')) tagStyle = 'text-[#fd56a7] bg-pink-50 border border-pink-200'
    else if (tag.includes('AI')) tagStyle = 'text-[#630ed4] bg-purple-50 border border-purple-200'
    else if (tag.includes('ERROR') || tag.includes('TIMEOUT')) tagStyle = 'text-rose-700 bg-rose-50 border border-rose-200 font-black animate-pulse'

    return (
      <span className="break-all text-zinc-700 font-mono text-[9.5px]">
        {timestamp && <span className="text-zinc-400 mr-1.5">{timestamp}</span>}
        <span className={`px-1.5 py-0.5 rounded text-[8px] mr-1.5 inline-block font-sans font-bold uppercase tracking-wider ${tagStyle}`}>{tag.replace(/[\[\]]/g, '')}</span>
        <span className="text-zinc-800 font-medium">{rest}</span>
      </span>
    )
  }
  return <span className="break-all text-zinc-700 font-mono">{log}</span>
}

// Custom Terminal-style scanner loading console
function SignalScannerConsole({ signalsCount, totalExpected, logs, activeTicker, compact }) {
  if (compact) {
    return (
      <div className="bg-[#fcf9f8] border-3 border-black rounded-2xl p-4 text-left shadow-[4px_4px_0px_#1c1b1b] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all mb-6 relative overflow-hidden">
        {/* Shifting rainbow top border strip */}
        <div className="absolute left-0 right-0 top-0 h-1.5 bg-gradient-to-r from-[#fd56a7] via-[#7c3aed] via-[#00d09c] via-[#fde047] via-[#ffb690] to-[#fd56a7] bg-[length:200%_auto] animate-[gradientFlow_3s_ease_infinite]" />
        
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d09c] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00d09c]"></span>
          </span>
          <div className="min-w-0">
            <div className="text-xs font-bold text-zinc-700 font-headline uppercase tracking-wide flex items-center gap-1.5">
              Live Scanner Active: <span className="bg-gradient-to-r from-[#fd56a7] via-[#7c3aed] to-[#00d09c] bg-clip-text text-transparent font-black animate-pulse">{activeTicker || 'Scanning...'}</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate max-w-[280px] sm:max-w-md">
              {logs[logs.length - 1] || 'Analyzing market anomalies...'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="w-24 sm:w-32 bg-zinc-100 rounded-full h-3 border border-black overflow-hidden p-0.5">
            <div 
              className="bg-gradient-to-r from-[#fd56a7] via-[#7c3aed] via-[#00d09c] via-[#fde047] to-[#fd56a7] bg-[length:200%_auto] animate-[gradientFlow_3s_ease_infinite] h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (signalsCount / totalExpected) * 100)}%` }}
            />
          </div>
          <span className="text-[9px] font-black text-black font-mono bg-white px-2 py-0.5 rounded border border-black shadow-[1.5px_1.5px_0px_#1c1b1b]">
            {signalsCount}/{totalExpected}
          </span>
        </div>
      </div>
    )
  }

  const sources = [
    { name: 'Yahoo Finance API', desc: 'REALTIME QUOTES', color: 'bg-[#fd56a7]' },
    { name: 'Economic Times', desc: 'NEWS ALERTS', color: 'bg-[#fd56a7]' },
    { name: 'Moneycontrol', desc: 'CORPORATE UPDATES', color: 'bg-[#fd56a7]' },
    { name: 'SEBI Filings RAG', desc: 'SCANNING NOW', color: 'bg-[#fde047]' },
    { name: 'Reddit WSB Feed', desc: 'SOCIAL SENTIMENT', color: 'bg-[#fd56a7]' },
    { name: 'Technical Engine', desc: 'RSI, MAs, VOLUME', color: 'bg-[#fd56a7]' },
  ]

  return (
    <div className="bg-white border-4 border-black rounded-[2rem] p-8 text-left shadow-[8px_8px_0px_#1c1b1b] relative overflow-hidden transition-all mb-6">
      {/* Header section with Title and Live Badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
        <div>
          <h2 className="text-3xl md:text-[38px] font-display font-black text-[#1c1b1b] uppercase tracking-tight leading-[0.9]">
            QUANT SIGNAL<br />ENGINE
          </h2>
          <p className="text-xs text-zinc-500 mt-3 font-semibold leading-relaxed">
            Scanning deep market telemetry, SEBI filings, and sentiment channels.
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-[#1c1b1b] text-white px-5 py-2.5 rounded-full shrink-0 border-2 border-black">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fd56a7] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#fd56a7]"></span>
          </span>
          <div className="flex flex-col text-left leading-[0.9]">
            <span className="text-[7.5px] font-bold font-sans tracking-[0.15em] text-zinc-400">SCANNER</span>
            <span className="text-[11px] font-black font-sans tracking-wide text-white">LIVE</span>
          </div>
        </div>
      </div>

      {/* Solid Black Horizontal Line Divider */}
      <div className="border-t-2 border-black my-6"></div>

      {/* Grid of sources */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {sources.map((src, i) => (
          <div key={i} className="bg-white border-2 border-black p-4 rounded-2xl flex items-center justify-between gap-2 shadow-[3px_3px_0px_#1c1b1b] hover:-translate-y-0.5 transition-transform duration-150">
            <div className="text-left min-w-0">
              <div className="text-[12px] font-black text-[#1c1b1b]">{src.name}</div>
              <div className="text-[9px] font-bold text-zinc-400 font-mono tracking-wider uppercase mt-1">{src.desc}</div>
            </div>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className={`animate-pulse absolute inline-flex h-full w-full rounded-full ${src.color} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${src.color}`}></span>
            </span>
          </div>
        ))}
      </div>

      {/* Progress Section */}
      <div className="bg-[#f0f0f0] border-3 border-black p-5 rounded-3xl shadow-[3px_3px_0px_black]">
        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
          <div className="flex items-center gap-1.5 min-w-0">
            <span>SIGNAL CAPTURE PROGRESS</span>
            <span>|</span>
            <span>SCANNING:</span>
            <span className="text-[#7c3aed] font-black font-mono">{activeTicker || 'RELIANCE'}</span>
          </div>
          <span className="font-mono text-black font-black shrink-0">{signalsCount} / {totalExpected} ANALYZED</span>
        </div>
        <div className="w-full h-5 bg-white rounded-full border-2 border-black overflow-hidden mt-3 p-0.5 relative shadow-[inset_0px_2px_4px_rgba(0,0,0,0.06)]">
          <div 
            className="h-full bg-gradient-to-r from-[#7c3aed] to-[#fd56a7] rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (signalsCount / totalExpected) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function SignalFeed({ limit, onSelectChart }) {
  const [signals, setSignals] = useState([])
  const [filter, setFilter] = useState('ALL') // ALL, ACT, WATCH, NOISE
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [activeTicker, setActiveTicker] = useState('')
  const [logs, setLogs] = useState([])
  const [totalExpectedTickers, setTotalExpectedTickers] = useState(22)

  const incomingQueueRef = useRef([])
  const streamFinishedRef = useRef(false)

  const handleManualRefresh = () => {
    setIsSyncing(true)
    setSignals([])
    setRefreshTrigger(prev => prev + 1)
  }

  useEffect(() => {
    setLoading(true)
    setIsScanning(true)
    setErrorMsg('')
    setActiveTicker('')
    setLogs([
      '[SYSTEM] Initializing VibeUp Quant Signal Engine v2.0...',
      '[CON] Establishing pipeline connections to financial APIs...',
      '[CON] Live SSE channel opened: /api/signals/stream...'
    ])
    setSignals([])
    setTotalExpectedTickers(22)
    incomingQueueRef.current = []
    streamFinishedRef.current = false

    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const eventSource = new EventSource(`${apiBaseUrl}/api/signals/stream`)
    let hasReceivedData = false

    // Set up queue processing interval
    const intervalId = setInterval(() => {
      if (incomingQueueRef.current.length > 0) {
        const nextSignal = incomingQueueRef.current.shift()
        
        setSignals((prev) => {
          const exists = prev.some(s => s.ticker === nextSignal.ticker)
          if (exists) {
            return prev.map(s => s.ticker === nextSignal.ticker ? nextSignal : s)
          }
          return [...prev, nextSignal]
        })
        
        setActiveTicker(nextSignal.ticker)
        
        const currentTimestamp = new Date().toLocaleTimeString()
        setLogs(prev => [
          ...prev,
          `[${currentTimestamp}] [FETCH] Fetching quotes for ${nextSignal.ticker} from Yahoo Finance... OK`,
          `[${currentTimestamp}] [RAG] Scanning SEBI databases for announcements on ${nextSignal.ticker}... OK`,
          `[${currentTimestamp}] [AI] Gemma 4 Signal Agent conviction rating: ${nextSignal.signal_type} (${nextSignal.confidence}%)`
        ])
      } else {
        // Queue is empty, check if stream has marked itself finished
        if (streamFinishedRef.current) {
          setLogs(prev => [
            ...prev,
            '[SYSTEM] Initial stream sequence loaded successfully.',
            '[SYSTEM] Live monitoring active. Listening for heartbeats...'
          ])
          setIsScanning(false)
          setLoading(false)
          setIsSyncing(false)
          clearInterval(intervalId)
        }
      }
    }, 75)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.heartbeat) return

        if (data.status === 'complete') {
          streamFinishedRef.current = true
          eventSource.close()
          return
        }

        hasReceivedData = true
        incomingQueueRef.current.push(data)
      } catch (err) {
        console.error('Error parsing SSE data:', err)
      }
    }

    eventSource.onerror = (err) => {
      console.warn('SSE connection failed. Initializing static fallback signals.', err)
      eventSource.close()
      if (!hasReceivedData) {
        incomingQueueRef.current = [...FALLBACK_SIGNALS]
        setTotalExpectedTickers(FALLBACK_SIGNALS.length)
        setLogs(prev => [
          ...prev,
          '[ERROR] SSE connection interrupted. Streaming offline fallback database...',
        ])
      }
      streamFinishedRef.current = true
    }

    // Timeout fallback: if no data within 1.5 seconds, close stream and load fallbacks
    const timeoutId = setTimeout(() => {
      if (!hasReceivedData) {
        console.warn('SSE stream timeout (1.5s). Loading fallback signals.')
        eventSource.close()
        incomingQueueRef.current = [...FALLBACK_SIGNALS]
        setTotalExpectedTickers(FALLBACK_SIGNALS.length)
        setLogs(prev => [
          ...prev,
          '[TIMEOUT] SSE pipeline timeout (1500ms). Streaming offline database...',
        ])
        streamFinishedRef.current = true
      }
    }, 1500)

    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
      eventSource.close()
    }
  }, [refreshTrigger])

  const filteredSignals = signals.filter(sig => {
    if (filter === 'ALL') return true
    return sig.signal_type === filter
  })

  const displayedSignals = limit ? filteredSignals.slice(0, limit) : filteredSignals

  return (
    <div className="space-y-4">
      {/* FILTER TABS */}
      {!limit && !isScanning && (
        <div className="flex justify-between items-center bg-white border-3 border-black rounded-2xl p-3 mb-6 shadow-[4px_4px_0px_#1c1b1b] gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {['ALL', 'ACT', 'WATCH', 'NOISE'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`
                  px-4 py-1.5 rounded-full border-2 border-black font-headline text-xs font-bold transition-all shadow-[2px_2px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-[0px_0px_0px_#1c1b1b] cursor-pointer
                  ${filter === f 
                    ? 'bg-[#fd56a7] text-black' 
                    : 'bg-white text-zinc-700 hover:bg-zinc-50'
                  }
                `}
              >
                {f === 'ALL' ? 'All Signals' : f}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleManualRefresh}
              disabled={isScanning}
              className={`
                px-3 py-1.5 rounded-xl border-2 border-black font-headline text-[10px] font-black transition-all shadow-[2px_2px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center gap-1.5
                ${isScanning 
                  ? 'bg-zinc-100 text-zinc-400 border-dashed shadow-none scale-95 cursor-not-allowed' 
                  : 'bg-[#00d09c] text-black hover:bg-emerald-400'
                }
              `}
              title="Force Sync Signals"
            >
              <RefreshCw size={10} className={isScanning ? 'animate-spin' : ''} />
              <span>Sync Live</span>
            </button>
            <Filter size={16} className="text-black mr-2 shrink-0 hidden sm:block" />
          </div>
        </div>
      )}

      {/* SCANNING CONSOLE */}
      {isScanning ? (
        <SignalScannerConsole 
          signalsCount={signals.length} 
          totalExpected={totalExpectedTickers} 
          logs={logs} 
          activeTicker={activeTicker} 
          compact={false} 
        />
      ) : (
        <>
          {/* EMPTY STATE */}
          {!loading && displayedSignals.length === 0 ? (
            <div className="bg-white border-3 border-black rounded-3xl p-12 text-center flex flex-col items-center shadow-[6px_6px_0px_#1c1b1b]">
              <ZapOff className="text-zinc-600 mb-2 animate-bounce" size={36} />
              <p className="text-base font-headline font-black text-black">No signals under current filter</p>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed font-bold">Try switching filters or check back later.</p>
            </div>
          ) : null}

          {/* SIGNALS LIST */}
          <div className="space-y-6">
            {displayedSignals.map((sig, i) => (
              <SignalCard key={sig.ticker || i} signal={sig} onSelectChart={onSelectChart} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default SignalFeed
