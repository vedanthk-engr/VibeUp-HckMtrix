import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVibeStore } from '../store/vibeStore'
import { api } from '../lib/api'
import { HoldingCard } from '../components/Portfolio/HoldingCard'
import { PortfolioChart } from '../components/Portfolio/PortfolioChart'
import { Cell, PieChart, Pie, ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip as ChartTooltip, ZAxis } from 'recharts'
import { 
  Briefcase, ArrowUpRight, ArrowDownRight, Plus, X, Search, 
  Sparkles, Landmark, RefreshCw, LogOut, CheckCircle2 
} from 'lucide-react'

const COLORS = ['#7c3aed', '#b4136d', '#fd56a7', '#ffb690', '#fde047', '#00d09c']

const SECTOR_MAP = {
  ZOMATO: 'Consumer',
  TITAN: 'Consumer',
  TATASTEEL: 'Manufacturing',
  HAL: 'Defense',
  INFY: 'IT',
  TCS: 'IT',
  RELIANCE: 'Energy',
  HDFCBANK: 'Finance',
  PAYTM: 'Finance',
  JIOFIN: 'Finance',
  IREDA: 'Energy',
  RVNL: 'Infrastructure',
  ADANIPORTS: 'Infrastructure',
  TRENT: 'Consumer',
  SUZLON: 'Energy',
  COALINDIA: 'Energy',
  LT: 'Infrastructure',
  TATAMOTORS: 'Auto',
  GOLDBEES: 'Commodities',
  PFC: 'Finance',
  ONGC: 'Energy'
}

const GROWW_MOCK_HOLDINGS = [
  { ticker: 'ZOMATO', quantity: 120, avg_buy_price: 165.0, buy_date: '2026-03-10' },
  { ticker: 'RELIANCE', quantity: 15, avg_buy_price: 2850.0, buy_date: '2026-01-15' },
  { ticker: 'INFY', quantity: 25, avg_buy_price: 1480.0, buy_date: '2026-02-20' },
  { ticker: 'TATASTEEL', quantity: 300, avg_buy_price: 158.0, buy_date: '2026-04-05' }
]

export function Portfolio() {
  const { holdings, fetchHoldings, addHolding, deleteHolding } = useVibeStore()
  
  const [activeTab, setActiveTab] = useState('real') // real / paper / tax / audit
  const [showAddModal, setShowAddModal] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [summary, setSummary] = useState({
    total_value: 0,
    total_cost: 0,
    total_pnl: 0,
    total_pnl_percentage: 0,
    day_pnl: 0,
    day_pnl_percentage: 0,
    sector_allocation: [],
    history: []
  })

  // Quant risk and cash states
  const [cashBalance, setCashBalance] = useState(1000000)
  const [taxSummary, setTaxSummary] = useState({
    realized_stcg: 0,
    realized_ltcg: 0,
    unrealized_stcg: 0,
    unrealized_ltcg: 0,
    estimated_tax_payable: 0,
    tax_saving_harvest_opportunity: 0,
    positions: []
  })
  const [transactions, setTransactions] = useState([])
  const [optData, setOptData] = useState(null)
  const [loadingOpt, setLoadingOpt] = useState(false)

  const fetchOptimizationData = async () => {
    setLoadingOpt(true)
    try {
      const res = await api.get('/portfolio/optimization')
      if (res.data) {
        setOptData(res.data)
      }
    } catch (err) {
      console.warn("Failed to fetch optimization data:", err)
    } finally {
      setLoadingOpt(false)
    }
  }

  // Groww Integration State
  const [isGrowwConnected, setIsGrowwConnected] = useState(
    localStorage.getItem('groww_connected') === 'true'
  )
  const [showGrowwModal, setShowGrowwModal] = useState(false)
  const [growwStep, setGrowwStep] = useState(1) // 1: Login, 2: PIN, 3: OTP, 4: Syncing
  const [growwPhone, setGrowwPhone] = useState('')
  const [growwPin, setGrowwPin] = useState('')
  const [growwOtp, setGrowwOtp] = useState('')
  const [otpTimer, setOtpTimer] = useState(30)
  const [syncMessage, setSyncMessage] = useState('')
  const [isSyncingLive, setIsSyncingLive] = useState(false)

  // Add holding form state
  const [tickerInput, setTickerInput] = useState('')
  const [quantityInput, setQuantityInput] = useState('')
  const [costInput, setCostInput] = useState('')
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split('T')[0])
  const [submitting, setSubmitting] = useState(false)

  const reloadPortfolio = async () => {
    setLoadingSummary(true)
    await fetchHoldings()
    
    try {
      const summaryRes = await api.get('/portfolio/summary')
      if (summaryRes.data) {
        setSummary(summaryRes.data)
      }
    } catch (err) {
      console.warn('Failed to load portfolio summary statistics:', err)
    }

    try {
      const cashRes = await api.get('/portfolio/cash')
      if (cashRes.data) {
        setCashBalance(cashRes.data.cash_balance)
      }
    } catch (err) {
      console.warn('Failed to load cash balance:', err)
    }

    try {
      const taxRes = await api.get('/portfolio/tax-summary')
      if (taxRes.data) {
        setTaxSummary(taxRes.data)
      }
    } catch (err) {
      console.warn('Failed to load tax summary:', err)
    }

    try {
      const txRes = await api.get('/portfolio/transactions')
      if (txRes.data) {
        setTransactions(txRes.data)
      }
    } catch (err) {
      console.warn('Failed to load transactions:', err)
    }

    try {
      fetchOptimizationData()
    } catch (err) {}

    setLoadingSummary(false)
  }


  useEffect(() => {
    reloadPortfolio()
  }, [])

  // SMS OTP countdown timer
  useEffect(() => {
    let interval = null
    if (showGrowwModal && growwStep === 3 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1)
      }, 1000)
    } else if (otpTimer === 0) {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [showGrowwModal, growwStep, otpTimer])

  const filteredHoldings = useMemo(() => {
    return holdings.filter(h => activeTab === 'paper' ? h.is_paper : !h.is_paper)
  }, [holdings, activeTab])

  const localTabMetrics = useMemo(() => {
    let cost = 0
    let value = 0
    let pnl = 0
    
    filteredHoldings.forEach(h => {
      cost += h.quantity * h.avg_buy_price
      value += h.quantity * (h.current_price || h.avg_buy_price)
      pnl += h.pnl || 0
    })

    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0
    return {
      cost,
      value,
      pnl,
      pnlPct
    }
  }, [filteredHoldings])

  const dynamicSectorAllocation = useMemo(() => {
    if (filteredHoldings.length === 0) return []
    
    const allocationMap = {}
    let totalValue = 0
    
    filteredHoldings.forEach(h => {
      const val = h.quantity * (h.current_price || h.avg_buy_price)
      totalValue += val
      const sector = SECTOR_MAP[h.ticker.toUpperCase()] || 'Other'
      allocationMap[sector] = (allocationMap[sector] || 0) + val
    })
    
    if (totalValue === 0) return []
    
    return Object.entries(allocationMap).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
      percentage: (value / totalValue) * 100
    })).sort((a, b) => b.value - a.value)
  }, [filteredHoldings])

  const handleAddHoldingSubmit = async (e) => {
    e.preventDefault()
    if (!tickerInput || !quantityInput || !costInput) return

    setSubmitting(true)
    try {
      await addHolding({
        ticker: tickerInput.toUpperCase().trim(),
        quantity: parseFloat(quantityInput),
        avg_buy_price: parseFloat(costInput),
        buy_date: buyDate,
        is_paper: activeTab === 'paper'
      })
      
      setTickerInput('')
      setQuantityInput('')
      setCostInput('')
      setShowAddModal(false)
      
      await reloadPortfolio()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // Groww Mock Linkage Workflows
  const startGrowwLink = () => {
    setGrowwStep(1)
    setGrowwPhone('')
    setGrowwPin('')
    setGrowwOtp('')
    setOtpTimer(30)
    setShowGrowwModal(true)
  }

  const handleGrowwLogin = (e) => {
    e.preventDefault()
    if (!growwPhone) return
    setGrowwStep(2)
  }

  const handleGrowwPin = (e) => {
    e.preventDefault()
    if (growwPin.length < 4) return
    setGrowwStep(3)
    setOtpTimer(30)
  }

  const handleGrowwOtp = async (e) => {
    e.preventDefault()
    if (growwOtp.length < 6) return
    setGrowwStep(4)
    
    // Step 4 Sync Steps
    const steps = [
      "Verifying SMS OTP...",
      "Linking Groww Account ID (groww_usr_9021)...",
      "Downloading 4 holdings from Groww demat...",
      "Injecting assets to local SQLite ledger...",
      "Recalculating cost bases & returns...",
      "Done!"
    ]

    for (let i = 0; i < steps.length; i++) {
      setSyncMessage(steps[i])
      await new Promise(r => setTimeout(r, 700))
    }

    // Connect & write mock holdings to DB
    try {
      // 1. Purge existing real holdings to prevent duplicate syncs
      const realHoldings = holdings.filter(h => !h.is_paper)
      for (const h of realHoldings) {
        await deleteHolding(h.id)
      }

      // 2. Add Groww Holdings
      for (const stock of GROWW_MOCK_HOLDINGS) {
        await addHolding({
          ticker: stock.ticker,
          quantity: stock.quantity,
          avg_buy_price: stock.avg_buy_price,
          buy_date: stock.buy_date,
          is_paper: false
        })
      }

      localStorage.setItem('groww_connected', 'true')
      setIsGrowwConnected(true)
      setShowGrowwModal(false)
      await reloadPortfolio()
    } catch (err) {
      console.error("Groww Sync Error: ", err)
      alert("Failed to sync Groww holdings: " + err.message)
      setGrowwStep(1)
    }
  }

  const disconnectGroww = async () => {
    if (!confirm("Are you sure you want to unlink your Groww account? This will clear synced demat holdings.")) return
    
    setLoadingSummary(true)
    try {
      // Delete Groww holdings (non-paper holdings)
      const realHoldings = holdings.filter(h => !h.is_paper)
      for (const h of realHoldings) {
        await deleteHolding(h.id)
      }
      localStorage.setItem('groww_connected', 'false')
      setIsGrowwConnected(false)
      await reloadPortfolio()
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSummary(false)
    }
  }

  const triggerLiveSync = async () => {
    setIsSyncingLive(true)
    await reloadPortfolio()
    setTimeout(() => {
      setIsSyncingLive(false)
    }, 1000)
  }

  const handleResetPortfolio = async () => {
    if (!confirm("Are you sure you want to completely reset your portfolio? This will wipe out all holdings, transaction logs, and reset cash to ₹10,00,000.")) return
    try {
      await api.post('/portfolio/cash/reset')
      await reloadPortfolio()
    } catch (err) {
      console.error("Failed to reset portfolio:", err)
    }
  }


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-5xl mx-auto px-4 pt-4 pb-32 text-left relative"
    >
      {/* Background Sweeping Mascot SVG */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none opacity-20">
        <svg className="absolute top-[5%] left-[20%] w-24 h-24 text-rainbow-2 animate-float-mascot" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M8 12l3 3 5-5"></path>
        </svg>
      </div>

      {/* Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 mt-6 relative z-10">
        <div className="relative inline-block transform -rotate-1">
          <div className="absolute inset-0 bg-[#7dd3fc] transform -skew-x-12 translate-y-1.5 -z-10 rounded-2xl scale-105 border-3 border-black shadow-[4px_4px_0px_0px_#1c1b1b]" />
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-black uppercase tracking-tight relative z-10 px-5 py-2">
            your bag 💰
          </h2>
        </div>

        {/* Groww Link / Status controls */}
        <div className="flex items-center gap-3">
          {isGrowwConnected ? (
            <div className="flex items-center gap-2 bg-[#e6fbf7] border-3 border-black px-4 py-2 rounded-2xl shadow-[3px_3px_0px_#1c1b1b]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#00d09c] animate-pulse" />
              <span className="text-[10px] font-black font-headline text-[#00d09c] uppercase tracking-wider">
                Groww Linked
              </span>
              <button 
                onClick={triggerLiveSync}
                disabled={isSyncingLive}
                title="Sync now"
                className="p-1 hover:bg-zinc-100 rounded-md border border-zinc-300 ml-1 transition-all cursor-pointer"
              >
                <RefreshCw size={11} className={`text-zinc-600 ${isSyncingLive ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={disconnectGroww}
                title="Disconnect Account"
                className="p-1 hover:bg-rose-100 hover:text-rose-600 rounded-md border border-zinc-300 transition-all cursor-pointer text-zinc-500"
              >
                <LogOut size={11} />
              </button>
            </div>
          ) : (
            <button
              onClick={startGrowwLink}
              className="flex items-center gap-2 bg-[#00d09c] text-black font-black font-headline text-xs py-3 px-5 border-3 border-black rounded-2xl shadow-[3px_3px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1c1b1b] transition-all cursor-pointer transform -rotate-1"
            >
              <Landmark size={12} className="stroke-[3]" />
              <span>Connect Groww Account 🟢</span>
            </button>
          )}
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 mb-10">

        {/* Net Asset Value */}
        <div className="sticker-card bg-white p-6 relative overflow-hidden group transform rotate-1 border-3 border-black shadow-[5px_5px_0px_0px_#1c1b1b]">
          <div className="absolute top-0 left-0 w-full h-3.5 bg-[#7dd3fc] border-b-3 border-black" />
          <div className="flex justify-between items-start mb-4 mt-2">
            <span className="font-headline text-zinc-500 font-bold text-xs uppercase">Holdings Value</span>
            <div className="w-8 h-8 rounded-full border-2 border-black bg-[#7dd3fc] flex items-center justify-center font-bold text-xs">
              💼
            </div>
          </div>
          <div className="font-display text-2xl font-extrabold text-black">₹{localTabMetrics.value.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-zinc-400 font-mono mt-1">Capital Cost: ₹{localTabMetrics.cost.toLocaleString('en-IN')}</div>
        </div>

        {/* Total Returns */}
        <div className="sticker-card bg-white p-6 relative overflow-hidden group transform -rotate-1 border-3 border-black shadow-[5px_5px_0px_0px_#1c1b1b]">
          <div className="absolute top-0 left-0 w-full h-3.5 border-b-3 border-black bg-[#10b981]" />
          <div className="flex justify-between items-start mb-4 mt-2">
            <span className="font-headline text-zinc-500 font-bold text-xs uppercase">Total Returns</span>
            <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center ${localTabMetrics.pnl >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              {localTabMetrics.pnl >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            </div>
          </div>
          <div className={`font-display text-2xl font-extrabold ${localTabMetrics.pnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
            {localTabMetrics.pnl >= 0 ? '+' : ''}₹{Math.round(localTabMetrics.pnl).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono mt-1">{localTabMetrics.pnlPct.toFixed(2)}% net returns</div>
        </div>

        {/* Intraday Returns */}
        <div className="sticker-card bg-white p-6 relative overflow-hidden group transform rotate-1 border-3 border-black shadow-[5px_5px_0px_0px_#1c1b1b]">
          <div className="absolute top-0 left-0 w-full h-3.5 border-b-3 border-black bg-[#fd56a7]" />
          <div className="flex justify-between items-start mb-4 mt-2">
            <span className="font-headline text-zinc-500 font-bold text-xs uppercase">Today's Profit/Loss</span>
            <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center ${summary.day_pnl >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              {summary.day_pnl >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            </div>
          </div>
          <div className={`font-display text-2xl font-extrabold ${summary.day_pnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
            {summary.day_pnl >= 0 ? '+' : ''}₹{Math.round(summary.day_pnl).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono mt-1">{summary.day_pnl_percentage.toFixed(2)}% today</div>
        </div>
      </section>

      {/* Allocation and Growth Chart Grid */}
      <section className="grid lg:grid-cols-3 gap-6 relative z-10 mb-10">
        <div className="lg:col-span-2">
          <PortfolioChart historyData={summary.history} currentVal={localTabMetrics.value} />
        </div>

        {/* Sector Allocation */}
        <div className="sticker-card bg-white border-3 border-black rounded-3xl p-6 shadow-[5px_5px_0px_0px_#1c1b1b] flex flex-col justify-between overflow-hidden relative transform rotate-1 hover:rotate-0 transition-transform">
          <div>
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold font-headline">Asset Split</span>
            <h3 className="text-sm font-extrabold text-black font-display mt-0.5 uppercase">Sectors Breakdown</h3>
          </div>
 
          <div className="h-40 w-full relative flex items-center justify-center py-2 select-none">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dynamicSectorAllocation.length > 0 ? dynamicSectorAllocation : [{ name: 'Cash', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={62}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(dynamicSectorAllocation.length > 0 ? dynamicSectorAllocation : [{ name: 'Cash', value: 1 }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#1c1b1b" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider font-headline">Assets</span>
              <p className="text-xs font-black text-black mt-0.5">{filteredHoldings.length} Positions</p>
            </div>
          </div>
 
          {/* Sector Legend */}
          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
            {dynamicSectorAllocation.map((item, index) => (
              <div key={item.name} className="flex justify-between items-center text-[10px] font-bold font-headline">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0 border border-black" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-zinc-600 truncate max-w-[120px]">{item.name}</span>
                </div>
                <span className="text-black font-mono">{item.percentage.toFixed(1)}%</span>
              </div>
            ))}
            {dynamicSectorAllocation.length === 0 && (
              <div className="text-[10px] text-zinc-400 font-bold text-center">No active positions logged yet.</div>
            )}
          </div>
        </div>
      </section>

      {/* Holdings List Tab Switcher Header */}
      <section className="mb-32 relative z-10">
        <div className="flex gap-6 border-b-4 border-black mb-8 pb-4 overflow-x-auto no-scrollbar relative z-10 font-display">
          <button 
            onClick={() => setActiveTab('real')} 
            className={`text-2xl font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'real' ? 'text-black transform -rotate-1 relative' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            {isGrowwConnected ? 'Groww Holdings' : 'Holdings'}
            {activeTab === 'real' && <div className="absolute -bottom-[20px] left-0 w-full h-3.5 bg-black rounded-t-lg" />}
          </button>
          <button 
            onClick={() => setActiveTab('paper')} 
            className={`text-2xl font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'paper' ? 'text-black transform rotate-1 relative' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            Paper Trades
            {activeTab === 'paper' && <div className="absolute -bottom-[20px] left-0 w-full h-3.5 bg-black rounded-t-lg" />}
          </button>
          <button 
            onClick={() => setActiveTab('tax')} 
            className={`text-2xl font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'tax' ? 'text-black transform -rotate-1 relative' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            Tax Optimizer 💼
            {activeTab === 'tax' && <div className="absolute -bottom-[20px] left-0 w-full h-3.5 bg-black rounded-t-lg" />}
          </button>
          <button 
            onClick={() => setActiveTab('audit')} 
            className={`text-2xl font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'audit' ? 'text-black transform rotate-1 relative' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            Transactions 📜
            {activeTab === 'audit' && <div className="absolute -bottom-[20px] left-0 w-full h-3.5 bg-black rounded-t-lg" />}
          </button>
          <button 
            onClick={() => setActiveTab('opt')} 
            className={`text-2xl font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'opt' ? 'text-black transform -rotate-1 relative' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            Optimization Labs 📊
            {activeTab === 'opt' && <div className="absolute -bottom-[20px] left-0 w-full h-3.5 bg-black rounded-t-lg" />}
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="chunky-btn bg-rainbow-2 text-white font-extrabold text-xs py-2 px-5 shadow-[3px_3px_0px_0px_#1c1b1b] flex items-center gap-1 hover:bg-rainbow-1 transition-all cursor-pointer ml-auto border-3 border-black active:translate-y-0.5"
          >
            <Plus size={12} className="stroke-[3]" />
            <span>Add Position</span>
          </button>
        </div>

        {/* Positions display */}
        {(activeTab === 'real' || activeTab === 'paper') && (
          filteredHoldings.length === 0 ? (
            <div className="sticker-card bg-white border-3 border-black rounded-3xl p-12 text-center flex flex-col items-center shadow-[5px_5px_0px_0px_#1c1b1b] transform rotate-1">
              <Briefcase className="text-zinc-400 mb-2" size={32} />
              <p className="text-sm text-zinc-500 font-headline font-bold uppercase">No open positions in this ledger</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                {isGrowwConnected 
                  ? "No holdings downloaded from Groww. Try clicking Sync."
                  : "Tap 'Add Position' to log an entry, link your Groww account, or trade recommendations from Vibe Picks."
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-x-10 gap-y-12 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredHoldings.map((h, i) => (
                <div key={h.id} className="relative" style={{ transform: `rotate(${i % 2 === 0 ? -1 : 1}deg)` }}>
                  <HoldingCard holding={h} />
                </div>
              ))}
            </div>
          )
        )}

        {/* Tax Optimizer tab render */}
        {activeTab === 'tax' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Tax Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="sticker-card bg-white p-6 border-3 border-black shadow-[4px_4px_0px_#1c1b1b] rounded-2xl transform rotate-[-0.5deg]">
                <h4 className="text-[10px] uppercase text-zinc-500 font-black tracking-wider">Realized gains</h4>
                <div className="mt-2 flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-headline font-bold">
                    <span className="text-zinc-600">STCG (15% Tax):</span>
                    <span className={`font-mono font-black ${taxSummary.realized_stcg >= 0 ? 'text-[#00d09c]' : 'text-rose-500'}`}>
                      ₹{taxSummary.realized_stcg.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-zinc-100 pt-1 font-headline font-bold">
                    <span className="text-zinc-600">LTCG (10% Tax):</span>
                    <span className={`font-mono font-black ${taxSummary.realized_ltcg >= 0 ? 'text-[#00d09c]' : 'text-rose-500'}`}>
                      ₹{taxSummary.realized_ltcg.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="sticker-card bg-white p-6 border-3 border-black shadow-[4px_4px_0px_#1c1b1b] rounded-2xl transform rotate-[0.5deg]">
                <h4 className="text-[10px] uppercase text-zinc-500 font-black tracking-wider">Unrealized gains</h4>
                <div className="mt-2 flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-headline font-bold">
                    <span className="text-zinc-600">STCG (unlocked &lt;1yr):</span>
                    <span className={`font-mono font-black ${taxSummary.unrealized_stcg >= 0 ? 'text-[#00d09c]' : 'text-rose-500'}`}>
                      ₹{taxSummary.unrealized_stcg.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-zinc-100 pt-1 font-headline font-bold">
                    <span className="text-zinc-600">LTCG (held &gt;1yr):</span>
                    <span className={`font-mono font-black ${taxSummary.unrealized_ltcg >= 0 ? 'text-[#00d09c]' : 'text-rose-500'}`}>
                      ₹{taxSummary.unrealized_ltcg.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="sticker-card bg-white p-6 border-3 border-black shadow-[4px_4px_0px_#1c1b1b] rounded-2xl transform rotate-[-0.5deg] flex flex-col justify-between">
                <div>
                  <h4 className="text-[10px] uppercase text-zinc-500 font-black tracking-wider">Estimated Tax Payable</h4>
                  <div className="text-2xl font-display font-extrabold text-black mt-2">
                    ₹{taxSummary.estimated_tax_payable.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-[9px] text-zinc-400 font-bold uppercase mt-1">Computed on realized STCG & LTCG</div>
              </div>
            </div>

            {/* Tax loss harvesting banner */}
            {taxSummary.tax_saving_harvest_opportunity > 0 && (
              <div className="bg-[#fefce8] border-3 border-[#eab308] rounded-2xl p-5 shadow-[4px_4px_0px_#eab308] text-xs font-headline font-bold flex gap-3 items-center">
                <span className="text-2xl shrink-0">💡</span>
                <div>
                  <p className="text-black font-extrabold uppercase">Tax-Loss Harvesting Opportunity Identified!</p>
                  <p className="text-zinc-600 font-normal mt-0.5">
                    You have paper positions currently trading at a loss. You can sell underperforming shares to realize short-term capital losses, offsetting your taxable gains. Booking these losses could save you up to <span className="font-mono text-black font-black">₹{taxSummary.tax_saving_harvest_opportunity.toLocaleString('en-IN')}</span> in STCG taxes this fiscal.
                  </p>
                </div>
              </div>
            )}

            {/* Tax Positions Table */}
            <div className="sticker-card bg-white border-3 border-black rounded-3xl p-6 shadow-[5px_5px_0px_#1c1b1b] overflow-x-auto">
              <h3 className="font-display text-lg font-black text-black uppercase mb-4">Tax Classification of Holdings</h3>
              <table className="w-full text-[11px] font-headline font-bold text-left">
                <thead>
                  <tr className="border-b-3 border-black text-zinc-500 uppercase tracking-wider">
                    <th className="pb-3 font-black">Ticker</th>
                    <th className="pb-3 font-black">Qty</th>
                    <th className="pb-3 font-black">Avg Cost</th>
                    <th className="pb-3 font-black">Buy Date</th>
                    <th className="pb-3 font-black">Holding Period</th>
                    <th className="pb-3 font-black">Tax Bracket</th>
                    <th className="pb-3 font-black text-right">P&L</th>
                    <th className="pb-3 font-black text-right">Est. Tax if Sold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {taxSummary.positions.map((p) => (
                    <tr key={p.ticker} className="hover:bg-zinc-50">
                      <td className="py-3.5 text-black font-black">{p.ticker}</td>
                      <td className="py-3.5 font-mono">{p.quantity}</td>
                      <td className="py-3.5 font-mono">₹{p.avg_buy_price}</td>
                      <td className="py-3.5 font-mono text-zinc-500">{p.buy_date}</td>
                      <td className="py-3.5 font-mono text-zinc-600">{p.holding_period_days} days</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 border border-black rounded-full text-[9px] font-black uppercase tracking-wider ${p.category === 'LTCG' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                          {p.category}
                        </span>
                      </td>
                      <td className={`py-3.5 text-right font-mono font-black ${p.pnl >= 0 ? 'text-[#00d09c]' : 'text-rose-500'}`}>
                        {p.pnl >= 0 ? '+' : ''}₹{p.pnl.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 text-right font-mono text-zinc-700">₹{p.estimated_tax.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {taxSummary.positions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-zinc-400 font-bold uppercase">No active holdings found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transactions Audit Tab render */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center">
              <p className="text-xs text-zinc-500 font-headline font-bold uppercase">Complete ledger of executed paper orders</p>
              <button 
                onClick={handleResetPortfolio}
                className="chunky-btn bg-rose-500 text-white font-extrabold text-[10px] py-2 px-5 border-3 border-black rounded-xl shadow-[3px_3px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none hover:bg-rose-600 cursor-pointer"
              >
                Reset Portfolio & Cash 💥
              </button>
            </div>

            <div className="sticker-card bg-white border-3 border-black rounded-3xl p-6 shadow-[5px_5px_0px_#1c1b1b] overflow-x-auto">
              <table className="w-full text-[11px] font-headline font-bold text-left text-zinc-700">
                <thead>
                  <tr className="border-b-3 border-black text-zinc-500 uppercase tracking-wider">
                    <th className="pb-3 font-black">Date/Time</th>
                    <th className="pb-3 font-black">Ticker</th>
                    <th className="pb-3 font-black">Side</th>
                    <th className="pb-3 font-black">Qty</th>
                    <th className="pb-3 font-black">Execution Price</th>
                    <th className="pb-3 font-black">Govt/Regulatory Fees</th>
                    <th className="pb-3 font-black text-right">Total Trade Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {transactions.map((tx) => {
                    const totalFees = tx.stt + tx.gst + tx.stamp_duty + tx.exchange_fees + tx.brokerage;
                    return (
                      <tr key={tx.id} className="hover:bg-zinc-50">
                        <td className="py-3.5 font-mono text-zinc-400">{new Date(tx.created_at).toLocaleString('en-IN')}</td>
                        <td className="py-3.5 text-black font-black">{tx.ticker}</td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-0.5 border-2 border-black rounded-lg text-[9px] font-black uppercase tracking-wider ${tx.side === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {tx.side}
                          </span>
                        </td>
                        <td className="py-3.5 font-mono">{tx.quantity}</td>
                        <td className="py-3.5 font-mono">₹{tx.price}</td>
                        <td className="py-3.5 font-mono text-zinc-600" title={`STT: ₹${tx.stt}, GST: ₹${tx.gst}, Stamp: ₹${tx.stamp_duty}, Exch: ₹${tx.exchange_fees}`}>
                          ₹{totalFees.toFixed(2)}
                        </td>
                        <td className="py-3.5 text-right font-mono font-black text-black">
                          ₹{tx.total_value.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-400 font-bold uppercase">No transactions logged yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Optimization Labs render */}
        {activeTab === 'opt' && (
          <div className="space-y-10 animate-in fade-in duration-200">
            {loadingOpt && !optData ? (
              <div className="text-center font-mono text-xs font-bold text-zinc-500 py-12 animate-pulse uppercase">
                Calculating portfolio covariance matrix & efficient frontier coordinates...
              </div>
            ) : !optData || !optData.frontier_points || optData.frontier_points.length === 0 ? (
              <div className="sticker-card bg-white border-3 border-black rounded-3xl p-12 text-center flex flex-col items-center shadow-[5px_5px_0px_0px_#1c1b1b]">
                <span className="text-2xl mb-2">📊</span>
                <p className="text-sm text-zinc-500 font-headline font-bold uppercase">Insufficient Portfolio Data</p>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                  We need at least two open holdings in your bag to run covariance calculations and build the Markowitz Efficient Frontier.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Heatmap Section */}
                <div className="lg:col-span-6 flex flex-col gap-4">
                  <div className="sticker-card bg-white border-3 border-black rounded-3xl p-6 shadow-[5px_5px_0px_#1c1b1b]">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold font-headline block mb-1">Risk Heatmap</span>
                    <h3 className="text-base font-black text-black font-display uppercase mb-4">Historical Correlation Matrix</h3>
                    
                    <div className="overflow-x-auto">
                      <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-zinc-200 font-mono text-[10px] font-bold">
                          <thead>
                            <tr>
                              <th className="px-2 py-2 text-zinc-400 border border-black bg-zinc-50">Symbol</th>
                              {Object.keys(optData.correlation_matrix).map(symbol => (
                                <th key={symbol} className="px-2 py-2 text-black text-center border border-black bg-zinc-50">{symbol}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(optData.correlation_matrix).map(([rowSymbol, rowValues]) => (
                              <tr key={rowSymbol}>
                                <td className="px-2 py-2 text-black font-black border border-black bg-zinc-50">{rowSymbol}</td>
                                {Object.keys(optData.correlation_matrix).map(colSymbol => {
                                  const corrVal = rowValues[colSymbol];
                                  const color = corrVal > 0.05 
                                    ? `rgba(124, 58, 237, ${corrVal})` 
                                    : corrVal < -0.05 
                                      ? `rgba(239, 68, 68, ${Math.abs(corrVal)})` 
                                      : 'rgba(240, 240, 240, 0.4)';
                                  const textColor = (corrVal > 0.6 || corrVal < -0.6) ? 'text-white' : 'text-black';
                                  return (
                                    <td 
                                      key={colSymbol} 
                                      style={{ backgroundColor: color }}
                                      className={`px-2 py-3 text-center border border-black font-black ${textColor}`}
                                    >
                                      {corrVal !== undefined ? corrVal.toFixed(2) : '-'}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <p className="text-[8.5px] text-zinc-400 font-headline uppercase mt-4 tracking-wider leading-relaxed">
                      * Correlation of returns calculated using daily close quotes over the past 6 months. Purple indicates positive correlation, red indicates negative correlation.
                    </p>
                  </div>
                </div>

                {/* Plot Section */}
                <div className="lg:col-span-6 flex flex-col gap-6">
                  <div className="sticker-card bg-white border-3 border-black rounded-3xl p-6 shadow-[5px_5px_0px_#1c1b1b]">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold font-headline block mb-1">Efficient Frontier</span>
                    <h3 className="text-base font-black text-black font-display uppercase mb-4">Markowitz Portfolio Curve</h3>
                    
                    {/* Scatter Chart */}
                    <div className="h-64 w-full text-black">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: -10 }}>
                          <XAxis 
                            type="number" 
                            dataKey="volatility" 
                            name="Risk" 
                            unit="%" 
                            stroke="#000"
                            label={{ value: 'Risk (Std Dev %)', position: 'insideBottom', offset: -10, fontStyle: 'bold', fontSize: 10 }}
                            tick={{ fontSize: 9, fontWeight: 'bold' }}
                          />
                          <YAxis 
                            type="number" 
                            dataKey="return" 
                            name="Return" 
                            unit="%" 
                            stroke="#000"
                            label={{ value: 'Expected Return %', angle: -90, position: 'insideLeft', offset: 0, fontStyle: 'bold', fontSize: 10 }}
                            tick={{ fontSize: 9, fontWeight: 'bold' }}
                          />
                          <ZAxis type="number" range={[50, 200]} />
                          <ChartTooltip cursor={{ strokeDasharray: '3 3' }} />
                          
                          <Scatter 
                            name="Efficient Frontier" 
                            data={optData.frontier_points} 
                            fill="#8884d8" 
                            line 
                            shape="circle" 
                          />
                          
                          <Scatter 
                            name="Current Portfolio" 
                            data={[optData.current_portfolio]} 
                            fill="#fd56a7" 
                            shape="star" 
                          />
                          
                          <Scatter 
                            name="Max Sharpe Portfolio" 
                            data={[optData.optimal_portfolio]} 
                            fill="#fde047" 
                            shape="triangle" 
                          />

                          <Scatter 
                            name="Min Variance Portfolio" 
                            data={[optData.min_variance_portfolio]} 
                            fill="#7c3aed" 
                            shape="square" 
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legendary Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-[10px] font-black uppercase font-headline">
                      <div className="flex items-center gap-1.5 p-2 border-2 border-black rounded-xl bg-zinc-50 shadow-[1.5px_1.5px_0px_#000]">
                        <span className="h-2 w-2 rounded-full bg-[#8884d8] border border-black" />
                        <span className="text-zinc-650">Frontier</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 border-2 border-black rounded-xl bg-white shadow-[1.5px_1.5px_0px_#000]">
                        <span className="text-[#fd56a7] font-bold">★</span>
                        <span className="text-zinc-800">Current</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 border-2 border-black rounded-xl bg-[#fde047]/10 border-[#fde047] shadow-[1.5px_1.5px_0px_#fde047]">
                        <span className="text-[#eab308]">▲</span>
                        <span className="text-[#eab308]">Optimal</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 border-2 border-black rounded-xl bg-[#7c3aed]/10 border-[#7c3aed] shadow-[1.5px_1.5px_0px_#7c3aed]">
                        <span className="text-[#7c3aed]">■</span>
                        <span className="text-[#7c3aed]">Min Risk</span>
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Details Comparison Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-headline text-xs font-bold text-black">
                    <div className="sticker-card bg-white p-4 border-2 border-black rounded-2xl shadow-[3px_3px_0px_#000] transform rotate-[0.5deg]">
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block">Your Current Bag</span>
                      <div className="text-sm font-black text-black mt-2 font-display">Risk: {optData.current_portfolio.volatility}%</div>
                      <div className="text-xs font-bold text-zinc-500 font-mono mt-0.5">Return: {optData.current_portfolio.return}%</div>
                      <div className="text-[9px] text-[#fd56a7] font-black uppercase mt-1">Sharpe: {optData.current_portfolio.sharpe}</div>
                    </div>

                    <div className="sticker-card bg-white p-4 border-2 border-black rounded-2xl shadow-[3px_3px_0px_#fde047] border-[#fde047] transform rotate-[-0.5deg]">
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block">Optimal Sharpe Ratio</span>
                      <div className="text-sm font-black text-black mt-2 font-display">Risk: {optData.optimal_portfolio.volatility}%</div>
                      <div className="text-xs font-bold text-zinc-500 font-mono mt-0.5">Return: {optData.optimal_portfolio.return}%</div>
                      <div className="text-[9px] text-[#eab308] font-black uppercase mt-1">Sharpe: {optData.optimal_portfolio.sharpe}</div>
                    </div>

                    <div className="sticker-card bg-white p-4 border-2 border-black rounded-2xl shadow-[3px_3px_0px_#7c3aed] border-[#7c3aed] transform rotate-[0.5deg]">
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block">Minimum Variance</span>
                      <div className="text-sm font-black text-black mt-2 font-display">Risk: {optData.min_variance_portfolio.volatility}%</div>
                      <div className="text-xs font-bold text-zinc-500 font-mono mt-0.5">Return: {optData.min_variance_portfolio.return}%</div>
                      <div className="text-[9px] text-[#7c3aed] font-black uppercase mt-1">Sharpe: {optData.min_variance_portfolio.sharpe}</div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </section>

      {/* Add Holding Modal overlay */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-4 border-black rounded-3xl p-6 max-w-md w-full relative space-y-6 shadow-[8px_8px_0px_0px_#1c1b1b] text-left transform rotate-[-0.5deg]"
            >
              {/* Close */}
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-black cursor-pointer bg-bg-cream border-2 border-black w-8 h-8 rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#1c1b1b] active:translate-y-0.5"
              >
                <X size={14} className="stroke-[3]" />
              </button>

              <div className="flex items-center gap-2">
                <Sparkles className="text-rainbow-2" size={18} />
                <h3 className="text-sm font-black font-display text-black uppercase">Log Position</h3>
              </div>

              <form onSubmit={handleAddHoldingSubmit} className="space-y-4 font-headline font-bold text-xs">
                <div className="space-y-1.5">
                  <label className="text-zinc-600 uppercase tracking-wider block">Stock Ticker</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. ZOMATO, RELIANCE"
                      value={tickerInput}
                      onChange={(e) => setTickerInput(e.target.value)}
                      required
                      className="w-full bg-white border-3 border-black rounded-xl py-3 px-4 text-xs font-bold text-black uppercase focus:outline-none focus:border-rainbow-2 shadow-[3px_3px_0px_0px_#1c1b1b]"
                    />
                    <Search className="absolute right-4 top-3.5 text-zinc-500 font-extrabold" size={14} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-600 uppercase tracking-wider block">Quantity</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 50"
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(e.target.value)}
                      required
                      className="w-full bg-white border-3 border-black rounded-xl py-3 px-4 text-xs font-bold text-black focus:outline-none focus:border-rainbow-2 shadow-[3px_3px_0px_0px_#1c1b1b]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-600 uppercase tracking-wider block">Avg Buy Price (₹)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 185.20"
                      value={costInput}
                      onChange={(e) => setCostInput(e.target.value)}
                      required
                      className="w-full bg-white border-3 border-black rounded-xl py-3 px-4 text-xs font-bold text-black focus:outline-none focus:border-rainbow-2 shadow-[3px_3px_0px_0px_#1c1b1b]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-600 uppercase tracking-wider block">Buy Date</label>
                  <input
                    type="date"
                    value={buyDate}
                    onChange={(e) => setBuyDate(e.target.value)}
                    required
                    className="w-full bg-white border-3 border-black rounded-xl py-3 px-4 text-xs font-bold text-black focus:outline-none focus:border-rainbow-2 shadow-[3px_3px_0px_0px_#1c1b1b]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="
                    w-full py-3.5 mt-4 rounded-full bg-rainbow-3 text-white border-3 border-black font-extrabold text-xs uppercase
                    shadow-[3px_3px_0px_0px_#1c1b1b] hover:bg-rainbow-2 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_#1c1b1b]
                    transition-all cursor-pointer flex justify-center items-center gap-1.5
                  "
                >
                  {submitting ? 'Adding position...' : 'Submit Transaction'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Groww Linkage Modal Overlay */}
      <AnimatePresence>
        {showGrowwModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-4 border-black rounded-3xl p-6 max-w-sm w-full relative space-y-6 shadow-[8px_8px_0px_0px_#1c1b1b] text-left transform rotate-[0.5deg]"
            >
              {/* Close */}
              {growwStep < 4 && (
                <button 
                  onClick={() => setShowGrowwModal(false)}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-black cursor-pointer bg-bg-cream border-2 border-black w-8 h-8 rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#1c1b1b] active:translate-y-0.5"
                >
                  <X size={14} className="stroke-[3]" />
                </button>
              )}

              {/* Logo / Title */}
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-[#00d09c] flex items-center justify-center text-black font-black text-sm border-2 border-black">
                  G
                </div>
                <h3 className="text-base font-black font-display text-black uppercase tracking-tight">Link Groww Account</h3>
              </div>

              {/* Step 1: Login Phone/Email */}
              {growwStep === 1 && (
                <form onSubmit={handleGrowwLogin} className="space-y-4 font-headline font-bold text-xs">
                  <p className="text-zinc-600 leading-relaxed font-bold text-[11px]">
                    Enter your Groww registered Mobile number or Email address to begin.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-zinc-600 uppercase tracking-wider block">Mobile / Email</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9876543210 or user@email.com"
                      value={growwPhone}
                      onChange={(e) => setGrowwPhone(e.target.value)}
                      required
                      className="w-full bg-white border-3 border-black rounded-xl py-3 px-4 text-xs font-bold text-black focus:outline-none focus:border-[#00d09c] shadow-[3px_3px_0px_0px_#1c1b1b]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#00d09c] text-black border-3 border-black font-black text-xs uppercase shadow-[3px_3px_0px_0px_#1c1b1b] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                  >
                    Send OTP ➔
                  </button>
                </form>
              )}

              {/* Step 2: PIN */}
              {growwStep === 2 && (
                <form onSubmit={handleGrowwPin} className="space-y-4 font-headline font-bold text-xs">
                  <p className="text-zinc-600 leading-relaxed font-bold text-[11px]">
                    Enter your secure 4-digit Groww login PIN.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-zinc-600 uppercase tracking-wider block">Groww security PIN</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="• • • •"
                      value={growwPin}
                      onChange={(e) => setGrowwPin(e.target.value.replace(/\D/g, ''))}
                      required
                      className="w-full bg-white border-3 border-black rounded-xl py-3 px-4 text-center text-lg font-bold tracking-widest text-black focus:outline-none focus:border-[#00d09c] shadow-[3px_3px_0px_0px_#1c1b1b]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGrowwStep(1)}
                      className="flex-1 py-3 bg-white text-black border-3 border-black font-black text-xs uppercase rounded-xl shadow-[2px_2px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={growwPin.length < 4}
                      className="flex-[2] py-3 bg-[#00d09c] text-black border-3 border-black font-black text-xs uppercase rounded-xl shadow-[2px_2px_0px_#1c1b1b] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                    >
                      Verify PIN ➔
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: SMS OTP */}
              {growwStep === 3 && (
                <form onSubmit={handleGrowwOtp} className="space-y-4 font-headline font-bold text-xs">
                  <p className="text-zinc-600 leading-relaxed font-bold text-[11px]">
                    Enter the 6-digit verification code sent to your mobile.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-zinc-600 uppercase tracking-wider block">Enter OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={growwOtp}
                      onChange={(e) => setGrowwOtp(e.target.value.replace(/\D/g, ''))}
                      required
                      className="w-full bg-white border-3 border-black rounded-xl py-3 px-4 text-center text-base font-bold tracking-widest text-black focus:outline-none focus:border-[#00d09c] shadow-[3px_3px_0px_0px_#1c1b1b]"
                    />
                  </div>
                  
                  <div className="text-[10px] text-zinc-500 font-bold text-right">
                    {otpTimer > 0 ? (
                      <span>Resend OTP in {otpTimer}s</span>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => setOtpTimer(30)}
                        className="text-[#00d09c] underline hover:text-emerald-600 cursor-pointer"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGrowwStep(2)}
                      className="flex-1 py-3 bg-white text-black border-3 border-black font-black text-xs uppercase rounded-xl shadow-[2px_2px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={growwOtp.length < 6}
                      className="flex-[2] py-3 bg-[#00d09c] text-black border-3 border-black font-black text-xs uppercase rounded-xl shadow-[2px_2px_0px_#1c1b1b] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                    >
                      Link & Sync ➔
                    </button>
                  </div>
                </form>
              )}

              {/* Step 4: Connecting & Syncing Loader */}
              {growwStep === 4 && (
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  {/* Neon Brutalist Spinner */}
                  <div className="relative w-16 h-16 border-4 border-[#e5e2e1] border-t-[#00d09c] rounded-full animate-spin border-t-4" />
                  
                  <div className="text-center">
                    <p className="text-xs font-black text-zinc-400 font-headline uppercase tracking-wider">Sync Status</p>
                    <motion.p 
                      key={syncMessage}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm font-bold font-mono text-black mt-1"
                    >
                      {syncMessage}
                    </motion.p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}

export default Portfolio
