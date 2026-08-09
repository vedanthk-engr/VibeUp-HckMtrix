import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../lib/api'
import { PnLAnimation } from '../components/Regret/PnLAnimation'
import { RegretTimeline } from '../components/Regret/RegretTimeline'
import { 
  Search, Loader2, AlertCircle, Share2, Calendar, TrendingUp, 
  ArrowRight, RefreshCw, BarChart2, ArrowUpRight, ArrowDownRight,
  Layers, Brain, Zap, Plus, X, BookOpen, Clock
} from 'lucide-react'

// Alternative investments to compare against
const ALT_INVESTMENTS = [
  { label: 'Nifty 50 Index', ticker: 'NIFTY_ALT', color: '#630ed4' },
  { label: 'Gold (MCX)', ticker: 'GOLD_ALT', color: '#fde047' },
  { label: 'Fixed Deposit (7%)', ticker: 'FD_ALT', color: '#00d09c' },
  { label: 'Bitcoin (USD)', ticker: 'BTC_ALT', color: '#f97316' },
]

// Behavioral biases mapped to scenarios
const BEHAVIORAL_BIASES = [
  { 
    label: 'Loss Aversion', 
    desc: 'You feel losses 2x more intensely than equivalent gains.',
    trigger: (pnl) => pnl < 0
  },
  { 
    label: 'FOMO Entry', 
    desc: 'You bought after a rally, not before.',
    trigger: (pnl, pct) => pnl < 0 && pct > -10
  },
  { 
    label: 'Recency Bias', 
    desc: 'Past performance influenced your decision timing.',
    trigger: () => true
  },
  { 
    label: 'Anchoring', 
    desc: 'You mentally anchored to the peak price.',
    trigger: (pnl, pct) => pct < -15
  },
]

// Conversion comparisons (how much the lost money equals)
const getConversions = (absLoss) => [
  { label: 'iPhones', value: Math.round(absLoss / 90000), icon: '📱' },
  { label: 'Cups of chai', value: Math.round(absLoss / 15), icon: '☕' },
  { label: 'Flights to Goa', value: Math.round(absLoss / 5000), icon: '✈️' },
  { label: 'Netflix months', value: Math.round(absLoss / 649), icon: '🎬' },
]

export function Regret() {
  // Main sim state
  const [ticker, setTicker] = useState('ZOMATO')
  const [buyDate, setBuyDate] = useState('2023-11-20')
  const [amount, setAmount] = useState(50000)
  const [loading, setLoading] = useState(false)
  const [simData, setSimData] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Feature tabs
  const [activeTab, setActiveTab] = useState('result') // result | compare | behavioural | replay
  
  // Compare mode — up to 2 extra tickers
  const [compareTickers, setCompareTickers] = useState([])
  const [compareInput, setCompareInput] = useState('')
  const [compareData, setCompareData] = useState({})
  const [loadingCompare, setLoadingCompare] = useState(false)
  
  // Replay mode
  const [replayStep, setReplayStep] = useState(0)

  const runSimulation = async (e) => {
    e.preventDefault()
    if (!ticker || !buyDate || !amount) return
    setLoading(true)
    setErrorMsg('')
    setSimData(null)
    setCompareData({})
    setReplayStep(0)
    try {
      const response = await api.get(`/regret?ticker=${ticker.toUpperCase().trim()}&date=${buyDate}&amount=${amount}`)
      if (response.data) {
        setTimeout(() => {
          setSimData(response.data)
          setLoading(false)
          setActiveTab('result')
        }, 1500)
      }
    } catch (err) {
      setErrorMsg('Failed to run simulation. Try: ZOMATO, INFY, RELIANCE, TCS, TATASTEEL.')
      setLoading(false)
    }
  }

  const handleAddCompareTicker = async () => {
    if (!compareInput.trim() || compareTickers.includes(compareInput.toUpperCase()) || compareTickers.length >= 2) return
    const sym = compareInput.toUpperCase().trim()
    setCompareTickers(prev => [...prev, sym])
    setCompareInput('')
    setLoadingCompare(true)
    try {
      const res = await api.get(`/regret?ticker=${sym}&date=${buyDate}&amount=${amount}`)
      if (res.data) {
        setCompareData(prev => ({ ...prev, [sym]: res.data }))
      }
    } catch {}
    setLoadingCompare(false)
  }

  const handleRemoveCompareTicker = (sym) => {
    setCompareTickers(prev => prev.filter(t => t !== sym))
    setCompareData(prev => { const c = {...prev}; delete c[sym]; return c })
  }

  const handleShareCard = () => {
    if (navigator.share) {
      navigator.share({ title: `${simData.ticker} Regret Sim`, text: `I missed ${simData.ticker} and lost ₹${Math.abs(simData.pnl).toLocaleString('en-IN')}. Check yours on VibeUp!` })
    } else {
      alert('Link copied to clipboard! Share on WhatsApp or Instagram.')
    }
  }

  // Determine active biases
  const activeBiases = simData 
    ? BEHAVIORAL_BIASES.filter(b => b.trigger(simData.pnl, simData.pnl_percentage))
    : []

  // Replay data points
  const replayPoints = simData?.chart_data || []
  const currentReplayValue = replayPoints[replayStep]

  const TABS = [
    { id: 'result', label: 'Result', icon: BarChart2 },
    { id: 'compare', label: 'Compare', icon: Layers },
    { id: 'behavioural', label: 'Mind Trap', icon: Brain },
    { id: 'replay', label: 'Replay', icon: Clock },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-5xl mx-auto px-4 pt-4 pb-32 text-left relative"
    >
      {/* Header */}
      <header className="text-center mb-10 relative z-10 mt-4">
        <div className="inline-flex items-center gap-2 bg-black text-white text-[10px] font-mono font-bold px-3 py-1.5 rounded-full mb-4 border-2 border-black">
          <span className="w-1.5 h-1.5 bg-[#fd56a7] rounded-full animate-pulse" />
          TIME MACHINE ACTIVE
        </div>
        <h1 className="font-display text-4xl md:text-[60px] font-extrabold text-black tracking-tighter uppercase leading-none">
          Regret <span className="text-[#fd56a7]">Simulator</span>
        </h1>
        <p className="font-headline text-zinc-600 max-w-lg mx-auto mt-4 font-bold text-sm">
          Travel back. Calculate the damage. Learn the lesson.
        </p>
      </header>

      {/* Main Input Form — always visible */}
      <div className="w-full max-w-3xl mx-auto bg-white border-3 border-black shadow-[6px_6px_0px_0px_#1c1b1b] p-6 md:p-8 rounded-3xl mb-8 relative z-10">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b-2 border-dashed border-zinc-200">
          <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center">
            <Zap size={14} className="text-[#fde047]" />
          </div>
          <h2 className="font-headline text-sm font-black uppercase tracking-wider text-black">Configure Simulation</h2>
        </div>
        <form onSubmit={runSimulation} className="space-y-5">
          <div className="space-y-1.5">
            <label className="font-headline text-black font-extrabold text-[11px] uppercase tracking-widest">Which stock haunts you?</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. ZOMATO, TATASTEEL, INFY"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                required
                className="w-full bg-white border-3 border-black rounded-2xl py-3 px-5 pr-12 text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#fd56a7] focus:border-[#fd56a7] transition-all uppercase"
              />
              <Search className="absolute right-4 top-3.5 text-zinc-400" size={16} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-headline text-black font-extrabold text-[11px] uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={11} className="text-zinc-500" />
                When did you skip it?
              </label>
              <input
                type="date"
                value={buyDate}
                onChange={(e) => setBuyDate(e.target.value)}
                required
                className="w-full bg-white border-3 border-black rounded-2xl py-3 px-5 text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#fd56a7] transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-headline text-black font-extrabold text-[11px] uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp size={11} className="text-zinc-500" />
                Capital you would've used (Rs)?
              </label>
              <input
                type="number"
                placeholder="50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-white border-3 border-black rounded-2xl py-3 px-5 text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#fd56a7] transition-all"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="flex gap-3 bg-red-50 border-2 border-[#ef4444] rounded-2xl p-4 text-xs font-bold text-red-600">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 rounded-2xl bg-black text-[#fde047] border-3 border-black font-headline font-black text-sm uppercase tracking-wider shadow-[5px_5px_0px_0px_#fd56a7] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#fd56a7] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex justify-center items-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Computing alternate timeline...</>
            ) : (
              <><Zap size={16} /> Run Simulation</>
            )}
          </button>
        </form>
      </div>

      {/* LOADING STATE */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="bg-white border-4 border-black rounded-3xl p-10 text-center max-w-sm shadow-[8px_8px_0px_0px_#fd56a7] space-y-4">
              <div className="w-16 h-16 bg-[#fde047] border-4 border-black rounded-2xl flex items-center justify-center mx-auto">
                <Loader2 size={28} className="animate-spin text-black" />
              </div>
              <h3 className="text-lg font-black font-display text-black uppercase">Calculating alternate timeline...</h3>
              <p className="text-[10px] text-zinc-500 font-mono tracking-wider">DOWNSAMPLING TELEMETRY FROM YAHOO FINANCE</p>
              <div className="w-full h-2 bg-zinc-100 rounded-full border-2 border-black overflow-hidden">
                <motion.div 
                  className="h-full bg-[#fd56a7]"
                  initial={{ width: '0%' }}
                  animate={{ width: '85%' }}
                  transition={{ duration: 1.4, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESULTS AREA */}
      <AnimatePresence>
        {simData && !loading && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 18 }}
            className="relative z-10 max-w-3xl mx-auto space-y-6"
          >
            {/* Feature Tabs */}
            <div className="flex gap-2 bg-zinc-100 border-2 border-black rounded-2xl p-1.5 overflow-x-auto">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-headline font-black text-[11px] uppercase tracking-wide whitespace-nowrap cursor-pointer transition-all flex-1 justify-center
                    ${activeTab === id 
                      ? 'bg-black text-white shadow-[2px_2px_0px_0px_#fd56a7]' 
                      : 'text-zinc-500 hover:text-black hover:bg-white'
                    }
                  `}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>

            {/* TAB: RESULT */}
            {activeTab === 'result' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border-3 border-black rounded-3xl shadow-[6px_6px_0px_0px_#1c1b1b] overflow-hidden"
              >
                {/* Top banner */}
                <div className={`px-6 pt-6 pb-4 border-b-3 border-black text-center relative ${simData.pnl >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                  <button
                    onClick={() => setSimData(null)}
                    className="absolute top-4 right-4 text-xs font-bold text-zinc-500 hover:text-black cursor-pointer px-3 py-1.5 bg-white rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#1c1b1b] active:translate-y-0.5"
                  >
                    Reset
                  </button>
                  <div className="inline-flex items-center gap-1.5 bg-black text-white text-[9px] font-mono font-bold px-3 py-1 rounded-full mb-3">
                    <span className="w-1.5 h-1.5 bg-[#fde047] rounded-full" />
                    {simData.ticker} — IF YOU HAD BOUGHT ON {buyDate}
                  </div>
                  <PnLAnimation 
                    value={simData.pnl} 
                    percentage={simData.pnl_percentage} 
                    isPositive={simData.pnl >= 0} 
                  />
                </div>

                <div className="p-6 space-y-6">
                  {/* Tagline roast */}
                  <div className="bg-[#eaddff] text-black border-3 border-black rounded-2xl p-5 text-center shadow-[4px_4px_0px_0px_#1c1b1b]">
                    <p className="text-sm font-extrabold font-display leading-relaxed">
                      "{simData.tagline}"
                    </p>
                  </div>

                  {/* Sparkline chart */}
                  <RegretTimeline 
                    chartData={simData.chart_data} 
                    ticker={simData.ticker} 
                    isPositive={simData.pnl >= 0} 
                  />

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Initial Cost', value: `Rs${simData.amount.toLocaleString('en-IN')}` },
                      { label: 'Value Today', value: `Rs${Math.round(simData.current_value).toLocaleString('en-IN')}` },
                      { label: 'CAGR', value: `${simData.cagr.toFixed(1)}%` },
                      { label: 'Max Drawdown', value: `${simData.max_drawdown.toFixed(1)}%` },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-zinc-50 border-2 border-black rounded-xl p-4 hover:-translate-y-0.5 transition-transform shadow-[3px_3px_0px_0px_#1c1b1b]">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">{stat.label}</span>
                        <span className="text-base font-mono font-black text-black block mt-0.5">{stat.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Loss in real-life terms */}
                  {simData.pnl < 0 && (
                    <div className="border-2 border-dashed border-zinc-300 rounded-2xl p-5">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-3 font-headline">
                        The missed gain equals...
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {getConversions(Math.abs(simData.pnl)).map((c) => (
                          <div key={c.label} className="flex items-center gap-2 bg-white border-2 border-black rounded-xl p-3">
                            <span className="text-xl">{c.icon}</span>
                            <div>
                              <span className="font-black text-sm text-black block">{c.value.toLocaleString()}</span>
                              <span className="text-[9px] text-zinc-500 font-bold">{c.label}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Behavioral Insight */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-[#630ed4] font-bold uppercase tracking-widest font-display block">Behavioral Insight</span>
                    <div className="bg-zinc-50 border-2 border-black rounded-xl p-4 text-xs font-bold text-zinc-700 leading-relaxed">
                      {simData.behavioral_insight}
                    </div>
                  </div>

                  {/* Share button */}
                  <button
                    onClick={handleShareCard}
                    className="w-full flex items-center justify-center gap-1.5 py-3 px-6 rounded-2xl bg-white text-black border-3 border-black text-xs font-bold font-headline shadow-[3px_3px_0px_0px_#1c1b1b] hover:bg-[#fde047] hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    <Share2 size={13} className="stroke-[3]" />
                    <span>Share This Pain</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* TAB: COMPARE */}
            {activeTab === 'compare' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* Add ticker row */}
                <div className="bg-white border-3 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_#1c1b1b] space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b-2 border-dashed border-zinc-200">
                    <Layers size={16} className="text-[#630ed4]" />
                    <h3 className="font-headline font-black text-sm uppercase tracking-wide text-black">Compare Alternative Stocks</h3>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-bold">
                    What if you had bought a different stock on the same date with the same amount?
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. TITAN, RELIANCE"
                      value={compareInput}
                      onChange={(e) => setCompareInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCompareTicker())}
                      className="flex-1 bg-white border-2 border-black rounded-xl py-2.5 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#630ed4] uppercase"
                    />
                    <button
                      onClick={handleAddCompareTicker}
                      disabled={!compareInput.trim() || compareTickers.length >= 2}
                      className="bg-black text-white border-2 border-black rounded-xl px-4 py-2 font-black text-sm shadow-[3px_3px_0px_0px_#630ed4] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-40"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {compareTickers.map(sym => (
                      <span key={sym} className="flex items-center gap-1 bg-[#eaddff] border-2 border-black px-3 py-1 rounded-full text-xs font-black text-[#630ed4]">
                        {sym}
                        <button onClick={() => handleRemoveCompareTicker(sym)} className="cursor-pointer hover:text-black"><X size={10} /></button>
                      </span>
                    ))}
                    {loadingCompare && <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1"><RefreshCw size={10} className="animate-spin" /> Loading...</span>}
                  </div>
                </div>

                {/* Comparison Table */}
                <div className="bg-white border-3 border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_#1c1b1b]">
                  <div className="grid grid-cols-4 bg-zinc-100 border-b-2 border-black px-5 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                    <span>Stock</span><span>P&L</span><span>Return %</span><span>CAGR</span>
                  </div>
                  {/* Primary */}
                  <div className="grid grid-cols-4 items-center px-5 py-4 border-b border-zinc-100 bg-[#eaddff]/40">
                    <span className="font-black text-sm text-black">{simData.ticker}</span>
                    <span className={`font-mono font-black text-xs ${simData.pnl >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {simData.pnl >= 0 ? '+' : ''}Rs{Math.round(simData.pnl).toLocaleString('en-IN')}
                    </span>
                    <span className={`font-mono text-xs font-bold ${simData.pnl_percentage >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {simData.pnl_percentage >= 0 ? '+' : ''}{simData.pnl_percentage.toFixed(1)}%
                    </span>
                    <span className="font-mono text-xs text-zinc-700">{simData.cagr.toFixed(1)}%</span>
                  </div>
                  {/* Compare tickers */}
                  {compareTickers.map((sym) => {
                    const d = compareData[sym]
                    return (
                      <div key={sym} className="grid grid-cols-4 items-center px-5 py-4 border-b border-zinc-100">
                        <span className="font-black text-sm text-black">{sym}</span>
                        {d ? (
                          <>
                            <span className={`font-mono font-black text-xs ${d.pnl >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {d.pnl >= 0 ? '+' : ''}Rs{Math.round(d.pnl).toLocaleString('en-IN')}
                            </span>
                            <span className={`font-mono text-xs font-bold ${d.pnl_percentage >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {d.pnl_percentage >= 0 ? '+' : ''}{d.pnl_percentage.toFixed(1)}%
                            </span>
                            <span className="font-mono text-xs text-zinc-700">{d.cagr.toFixed(1)}%</span>
                          </>
                        ) : (
                          <span className="col-span-3 text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                            <RefreshCw size={10} className="animate-spin" /> Loading...
                          </span>
                        )}
                      </div>
                    )
                  })}
                  {compareTickers.length === 0 && (
                    <div className="px-5 py-8 text-center text-zinc-400 text-xs font-bold">
                      Add up to 2 tickers above to compare side-by-side.
                    </div>
                  )}
                </div>

                {/* Alt investment benchmarks */}
                <div className="bg-white border-3 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_#1c1b1b] space-y-3">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-500 font-headline border-b-2 border-dashed border-zinc-100 pb-2 mb-3">
                    vs. Alternative Investments (benchmark)
                  </h4>
                  {ALT_INVESTMENTS.map((alt) => {
                    // Estimate returns for known alternatives
                    const years = (new Date() - new Date(buyDate)) / (1000 * 60 * 60 * 24 * 365.25)
                    let annualReturn = 0
                    if (alt.ticker === 'NIFTY_ALT') annualReturn = 13.5
                    else if (alt.ticker === 'GOLD_ALT') annualReturn = 10.2
                    else if (alt.ticker === 'FD_ALT') annualReturn = 7.0
                    else if (alt.ticker === 'BTC_ALT') annualReturn = 45.0
                    const altValue = amount * Math.pow(1 + annualReturn / 100, years)
                    const altPnl = altValue - amount
                    const isPrimBetter = simData.pnl_percentage > (annualReturn * years)
                    return (
                      <div key={alt.ticker} className="flex items-center justify-between py-2.5 border-b border-zinc-100 last:border-0">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: alt.color }} />
                          <span className="text-xs font-bold text-black">{alt.label}</span>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <span className="font-mono text-xs font-bold text-emerald-700">
                            +Rs{Math.round(altPnl).toLocaleString('en-IN')}
                          </span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border border-black ${isPrimBetter ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {isPrimBetter ? 'You won' : 'Better alt'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* TAB: BEHAVIOURAL */}
            {activeTab === 'behavioural' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="bg-white border-3 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_#1c1b1b] space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b-2 border-dashed border-zinc-200">
                    <Brain size={16} className="text-[#630ed4]" />
                    <h3 className="font-headline font-black text-sm uppercase tracking-wide text-black">Mind Trap Analysis</h3>
                  </div>
                  <p className="text-xs text-zinc-600 font-bold leading-relaxed">
                    Based on your {simData.ticker} decision on {buyDate}, here are the psychological traps likely at play:
                  </p>
                  {activeBiases.map((bias, idx) => (
                    <div key={idx} className="flex gap-4 p-4 bg-[#eaddff]/30 border-2 border-black rounded-2xl">
                      <div className="w-8 h-8 bg-[#630ed4] rounded-xl flex items-center justify-center shrink-0 text-white font-black text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-headline font-black text-sm text-black uppercase tracking-wide">{bias.label}</h4>
                        <p className="text-xs text-zinc-600 font-bold mt-1 leading-relaxed">{bias.desc}</p>
                      </div>
                    </div>
                  ))}
                  {/* Emotional journey timeline */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-headline">Investor Emotional Journey</span>
                    {[
                      { phase: 'Excitement', when: 'Initial position considered', color: '#fde047', note: 'Dopamine spike at the idea of gains.' },
                      { phase: 'Doubt', when: 'Hesitation before buying', color: '#fb923c', note: 'Fear of being wrong keeps you out.' },
                      { phase: 'Regret', when: 'Stock moved without you', color: '#f43f5e', note: 'Loss aversion hits hardest here.' },
                      { phase: 'Rationalization', when: 'Telling yourself it was fine', color: '#a78bfa', note: 'Ego protection mechanism activates.' },
                      { phase: 'Learning', when: 'Right now — using VibeUp', color: '#00d09c', note: 'Awareness is the first step.' },
                    ].map((phase, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-3 h-3 rounded-full border-2 border-black shrink-0" style={{ backgroundColor: phase.color }} />
                          {idx < 4 && <div className="w-0.5 h-6 bg-zinc-200 my-0.5" />}
                        </div>
                        <div className="pb-1">
                          <span className="text-[11px] font-black text-black">{phase.phase}</span>
                          <span className="text-[9px] text-zinc-400 font-mono ml-2">{phase.when}</span>
                          <p className="text-[10px] text-zinc-600 font-bold mt-0.5">{phase.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prescription */}
                <div className="bg-black text-white border-3 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_#630ed4] space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen size={16} className="text-[#fde047]" />
                    <h3 className="font-headline font-black text-sm uppercase tracking-wide text-white">VibeBot Prescription</h3>
                  </div>
                  <div className="space-y-3 text-xs font-bold text-zinc-300 leading-relaxed">
                    <p>
                      Set a rules-based entry system — for example: "I will buy if the stock pulls back 5% and volume confirms." This removes emotion from the equation.
                    </p>
                    <p>
                      Use a position sizing calculator. Never risk more than 2% of your portfolio on a single trade.
                    </p>
                    <p>
                      Journal your trades. Track the reasoning, not just the outcome. Pattern recognition over time will reveal your dominant bias.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: REPLAY */}
            {activeTab === 'replay' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border-3 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_#1c1b1b] space-y-6"
              >
                <div className="flex items-center gap-2 pb-3 border-b-2 border-dashed border-zinc-200">
                  <Clock size={16} className="text-[#fd56a7]" />
                  <h3 className="font-headline font-black text-sm uppercase tracking-wide text-black">Day-by-Day Replay</h3>
                </div>
                <p className="text-xs text-zinc-500 font-bold">
                  Scrub through the timeline to see how your portfolio value would have changed each day.
                </p>

                {replayPoints.length > 0 ? (
                  <>
                    {/* Current replay snapshot */}
                    <div className="bg-zinc-50 border-2 border-black rounded-2xl p-5 text-center">
                      <div className="text-[9px] font-mono text-zinc-400 mb-1">
                        DAY {replayStep + 1} OF {replayPoints.length}
                      </div>
                      <div className={`font-display text-3xl font-black ${currentReplayValue >= amount ? 'text-emerald-700' : 'text-rose-700'}`}>
                        Rs{Math.round(currentReplayValue).toLocaleString('en-IN')}
                      </div>
                      <div className={`text-xs font-bold mt-1 flex items-center justify-center gap-1 ${currentReplayValue >= amount ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {currentReplayValue >= amount ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        Rs{Math.abs(Math.round(currentReplayValue - amount)).toLocaleString('en-IN')} ({((currentReplayValue - amount) / amount * 100).toFixed(1)}%)
                      </div>
                    </div>

                    {/* Scrubber */}
                    <div className="space-y-3">
                      <input
                        type="range"
                        min={0}
                        max={replayPoints.length - 1}
                        value={replayStep}
                        onChange={(e) => setReplayStep(parseInt(e.target.value))}
                        className="w-full accent-[#fd56a7] cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                        <span>Entry date</span>
                        <span>Today</span>
                      </div>
                    </div>

                    {/* Replay buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setReplayStep(0)}
                        className="flex-1 py-2.5 border-2 border-black rounded-xl font-headline font-black text-[11px] uppercase bg-white hover:bg-zinc-50 shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer transition-all"
                      >
                        Start
                      </button>
                      <button
                        onClick={() => setReplayStep(Math.max(0, replayStep - 1))}
                        className="flex-1 py-2.5 border-2 border-black rounded-xl font-headline font-black text-[11px] uppercase bg-white hover:bg-zinc-50 shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer transition-all"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setReplayStep(Math.min(replayPoints.length - 1, replayStep + 1))}
                        className="flex-1 py-2.5 border-2 border-black rounded-xl font-headline font-black text-[11px] uppercase bg-white hover:bg-zinc-50 shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer transition-all"
                      >
                        Next
                      </button>
                      <button
                        onClick={() => setReplayStep(replayPoints.length - 1)}
                        className="flex-1 py-2.5 border-2 border-black rounded-xl font-headline font-black text-[11px] uppercase bg-[#fde047] hover:bg-yellow-300 shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer transition-all"
                      >
                        Now
                      </button>
                    </div>

                    {/* Milestones */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-headline">Key Milestones</span>
                      {[
                        { step: 0, label: 'Day you skipped buying', icon: '📅' },
                        { step: Math.floor(replayPoints.length * 0.25), label: '3-month mark', icon: '📊' },
                        { step: Math.floor(replayPoints.length * 0.5), label: '6-month mark', icon: '🔄' },
                        { step: replayPoints.length - 1, label: 'Today', icon: '🎯' },
                      ].map((m) => {
                        const val = replayPoints[m.step]
                        if (!val) return null
                        const pct = ((val - amount) / amount * 100)
                        return (
                          <button
                            key={m.step}
                            onClick={() => setReplayStep(m.step)}
                            className="w-full flex items-center justify-between p-3 bg-zinc-50 border-2 border-black rounded-xl hover:bg-zinc-100 cursor-pointer transition-all text-left"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">{m.icon}</span>
                              <span className="text-[11px] font-bold text-black">{m.label}</span>
                            </div>
                            <div className="text-right">
                              <span className={`font-mono text-xs font-black ${pct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-zinc-400 text-xs font-bold">
                    <Clock size={24} className="mx-auto mb-2 opacity-50" />
                    No timeline data available for replay.
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Regret
