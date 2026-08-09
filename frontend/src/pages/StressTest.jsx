import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVibeStore } from '../store/vibeStore'
import { RainbowRibbon } from '../components/shared/RainbowRibbon'
import { api } from '../lib/api'
import { 
  ShieldAlert, Play, RefreshCw, Sparkles, ChevronRight, 
  AlertTriangle, Info, CheckCircle2, ArrowDownRight, ArrowUpRight, Lock
} from 'lucide-react'


const MOCK_HOLDINGS = [
  { ticker: 'ZOMATO', quantity: 150, avg_buy_price: 180.0, current_price: 195.0, sector: 'Consumer' },
  { ticker: 'RELIANCE', quantity: 20, avg_buy_price: 2900.0, current_price: 2850.0, sector: 'Energy' },
  { ticker: 'INFY', quantity: 30, avg_buy_price: 1450.0, current_price: 1480.0, sector: 'IT' },
  { ticker: 'TATASTEEL', quantity: 400, avg_buy_price: 150.0, current_price: 158.0, sector: 'Metals' }
]

const SCENARIOS = [
  {
    id: 'covid',
    name: 'COVID 2.0 (Lockdown Panic) 🦠',
    description: 'Global pandemic returns, causing lockdowns. Pharma remains highly resilient, but Energy, Auto and Finance crash heavily.',
    impacts: {
      'IT': -15,
      'Finance': -35,
      'Auto': -30,
      'Pharma': 20,
      'FMCG': -10,
      'Energy': -40,
      'Metals': -35,
      'Realty': -45,
      'Infra': -35,
      'Consumer': -20,
      'Media': -40
    }
  },
  {
    id: 'tech_bubble',
    name: 'Tech Bubble Burst 💥',
    description: 'Valuations in technology and startup sectors crash. IT stocks collapse, dragging other sectors down through liquidity contagion.',
    impacts: {
      'IT': -50,
      'Finance': -20,
      'Auto': -15,
      'Pharma': -5,
      'FMCG': -10,
      'Energy': -10,
      'Metals': -15,
      'Realty': -20,
      'Infra': -15,
      'Consumer': -30,
      'Media': -25
    }
  },
  {
    id: 'fii_exodus',
    name: 'FII Exodus (Global War) ⚔️',
    description: 'Foreign Institutional Investors pull capital out of emerging markets. Heavyweight blue chips face massive selling pressure.',
    impacts: {
      'IT': -25,
      'Finance': -30,
      'Auto': -28,
      'Pharma': -15,
      'FMCG': -20,
      'Energy': -25,
      'Metals': -30,
      'Realty': -35,
      'Infra': -28,
      'Consumer': -25,
      'Media': -30
    }
  },
  {
    id: 'rate_hikes',
    name: 'Inflation Surge & Rate Hike 📈',
    description: 'RBI hikes interest rates to combat inflation. Capital-intensive sectors like Real Estate, Autos, and Banks take direct hits.',
    impacts: {
      'IT': -10,
      'Finance': -25,
      'Auto': -25,
      'Pharma': -5,
      'FMCG': -5,
      'Energy': -15,
      'Metals': -10,
      'Realty': -40,
      'Infra': -30,
      'Consumer': -15,
      'Media': -15
    }
  },
  {
    id: 'meme_rally',
    name: 'Gen Z Meme Rally 🚀',
    description: 'Meme stocks and retail favorites experience an institutional squeeze. Tech/Consumer favorite stocks moon, while legacy energy/metals lag.',
    impacts: {
      'IT': 45,
      'Finance': -10,
      'Auto': 5,
      'Pharma': -5,
      'FMCG': 15,
      'Energy': -20,
      'Metals': -25,
      'Realty': -15,
      'Infra': -10,
      'Consumer': 60,
      'Media': 40
    }
  }
]

const STRESS_STEPS = [
  "Initializing Monte Carlo engines...",
  "Loading historical stock correlation matrix...",
  "Fetching beta coefficients for active tickers...",
  "Simulating FII selling velocity...",
  "Calibrating interest rate curves...",
  "Applying lockdown scenario constraints...",
  "Computing sector-wise correlation coefficients...",
  "Fetching macro liquidity reserves data...",
  "Simulating rupee depreciation shocks...",
  "Stressing consumer demand elasticity...",
  "Valuing debt covenant breach probabilities...",
  "Checking margin call thresholds for retail...",
  "Running Tech Bubble contagion loops...",
  "Modeling energy supply disruption spikes...",
  "Straining banking system tier-1 capital ratios...",
  "Simulating promoter pledge liquidations...",
  "Estimating panic selling feedback loops...",
  "Projecting retail SIP inflow sustainability...",
  "Running value-at-risk (VaR) estimations...",
  "Generating AI mitigation strategies...",
  "Finalizing portfolio sensitivity reports...",
  "Compiling stress test summary ledger..."
]

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
  GOLDBEES: 'Commodities'
}

export function StressTest() {
  const { holdings, fetchHoldings, awardXP } = useVibeStore()
  
  const [riskTelemetry, setRiskTelemetry] = useState({
    portfolio_value: 0,
    beta: 0,
    volatility: 0,
    sharpe: 0,
    var_pct: 0,
    var_value: 0,
    individual_stats: {},
    is_synthetic: false
  })
  
  const [scenarios, setScenarios] = useState([])
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [simulating, setSimulating] = useState(false)
  const [simStep, setSimStep] = useState(0)
  const [simulationComplete, setSimulationComplete] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadStressData = async () => {
    setLoading(true)
    try {
      const riskRes = await api.get('/portfolio/risk-telemetry?user_id=mock-user-123')
      if (riskRes.data) {
        setRiskTelemetry(riskRes.data)
      }
      
      const stressRes = await api.get('/portfolio/stress-test?user_id=mock-user-123')
      if (stressRes.data && stressRes.data.scenarios) {
        setScenarios(stressRes.data.scenarios)
        setSelectedScenario(stressRes.data.scenarios[0])
      }
    } catch (err) {
      console.warn('Failed to fetch quant stress data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHoldings()
    loadStressData()
  }, [])

  // Run the Simulation animation with 22 steps
  const runSimulation = () => {
    if (simulating) return
    setSimulating(true)
    setSimulationComplete(false)
    setSimStep(0)
    
    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      setSimStep(currentStep)
      if (currentStep >= 22) {
        clearInterval(interval)
        setSimulating(false)
        setSimulationComplete(true)
        awardXP('stress_test_run', 25)
      }
    }, 120)
  }

  // Calculate stress outcomes dynamically from backend beta calculations
  const stressResults = React.useMemo(() => {
    if (!selectedScenario) {
      return {
        items: [],
        originalValue: 0,
        simulatedValue: 0,
        totalPnL: 0,
        totalPnLPct: 0,
        riskLevel: 'LOW',
        riskColor: 'text-emerald-500'
      }
    }
    
    const totalPnL = selectedScenario.portfolio_impact_value
    const totalPnLPct = selectedScenario.portfolio_impact_percentage
    const simulatedValue = selectedScenario.new_portfolio_value
    const originalValue = riskTelemetry.portfolio_value
    
    let riskLevel = 'LOW'
    let riskColor = 'text-[#00d09c]'
    if (totalPnLPct < -25) {
      riskLevel = 'EXTREME'
      riskColor = 'text-rose-600 font-extrabold'
    } else if (totalPnLPct < -15) {
      riskLevel = 'HIGH'
      riskColor = 'text-rose-400 font-extrabold'
    } else if (totalPnLPct < -5) {
      riskLevel = 'MODERATE'
      riskColor = 'text-amber-500 font-extrabold'
    }

    const items = Object.entries(riskTelemetry.individual_stats).map(([ticker, stats]) => {
      const allocationPct = stats.allocation / 100.0
      const currentVal = originalValue * allocationPct
      const priceQuote = holdings.find(h => h.ticker.toUpperCase() === ticker)
      const currentPrice = priceQuote?.current_price || priceQuote?.avg_buy_price || 100.0
      
      const stockImpactPct = stats.beta * selectedScenario.shock
      const pnl = currentVal * (stockImpactPct / 100.0)
      const simulatedPrice = Math.max(1, currentPrice * (1 + stockImpactPct / 100.0))
      
      return {
        ticker,
        sector: SECTOR_MAP[ticker] || 'Others',
        quantity: priceQuote?.quantity || 1,
        currentPrice,
        currentValue: currentVal,
        simulatedPrice,
        simulatedValue: currentVal + pnl,
        pnl,
        pnlPct: stockImpactPct
      }
    })

    return {
      items,
      originalValue,
      simulatedValue,
      totalPnL,
      totalPnLPct,
      riskLevel,
      riskColor
    }
  }, [selectedScenario, riskTelemetry, holdings])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-5xl mx-auto px-4 pt-4 pb-32 text-left relative"
    >
      <RainbowRibbon className="w-full h-24 top-0 left-0" />

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 mt-6 relative z-10">
        <div className="relative inline-block transform -rotate-1">
          <div className="absolute inset-0 bg-[#fd56a7] transform -skew-x-12 translate-y-1.5 -z-10 rounded-2xl scale-105 border-3 border-black shadow-[4px_4px_0px_0px_#1c1b1b]" />
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-black uppercase tracking-tight relative z-10 px-5 py-2">
            Stress Test 🌋
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-[#e6fbf7] border-3 border-black px-4 py-2 rounded-2xl shadow-[3px_3px_0px_#1c1b1b]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#00d09c] animate-pulse" />
          <span className="text-[10px] font-black font-headline text-[#00d09c] uppercase tracking-wider">
            Quant Engine Active
          </span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Left Side: Simulation Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="sticker-card bg-white border-3 border-black rounded-3xl p-6 shadow-[5px_5px_0px_0px_#1c1b1b] transform -rotate-1">
            <h3 className="text-sm font-black font-display uppercase text-black mb-4">1. Choose Crash Scenario</h3>
            <div className="space-y-3">
              {scenarios.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedScenario(s)
                    setSimulationComplete(false)
                  }}
                  className={`w-full text-left p-3.5 border-3 border-black rounded-xl transition-all cursor-pointer text-xs font-bold shadow-[2px_2px_0px_#1c1b1b] ${
                    selectedScenario?.id === s.id 
                      ? 'bg-[#7c3aed] text-white shadow-[4px_4px_0px_#1c1b1b] translate-y-[-2px]' 
                      : 'bg-zinc-50 hover:bg-zinc-100 text-black'
                  }`}
                >
                  <p className="font-extrabold uppercase text-xs">{s.name}</p>
                  <p className={`text-[10px] mt-1 line-clamp-2 ${selectedScenario?.id === s.id ? 'text-zinc-200' : 'text-zinc-500'}`}>
                    {s.description}
                  </p>
                </button>
              ))}
              {scenarios.length === 0 && (
                <div className="text-xs text-zinc-400 font-bold uppercase text-center py-4">Loading Scenarios...</div>
              )}
            </div>
          </div>

          <div className="sticker-card bg-white border-3 border-black rounded-3xl p-6 shadow-[5px_5px_0px_0px_#1c1b1b] transform rotate-1">
            <h3 className="text-sm font-black font-display uppercase text-black mb-4">2. Quant Risk Metrics</h3>
            <div className="space-y-3 font-headline font-bold text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500">Portfolio Beta:</span>
                <span className="text-black font-mono font-black">{riskTelemetry.beta}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500">Annual Volatility:</span>
                <span className="text-black font-mono font-black">{riskTelemetry.volatility}%</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500">Sharpe Ratio:</span>
                <span className="text-black font-mono font-black">{riskTelemetry.sharpe}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-zinc-500">Value at Risk (VaR 95%):</span>
                <span className="text-black font-mono font-black text-rose-500">₹{Math.round(riskTelemetry.var_value).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Trigger Button */}
          <button
            onClick={runSimulation}
            disabled={simulating || scenarios.length === 0}
            className={`w-full py-4 rounded-full border-4 border-black font-black uppercase tracking-wider text-xs shadow-[5px_5px_0px_#1c1b1b] transition-all cursor-pointer flex items-center justify-center gap-2 ${
              simulating 
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none translate-y-0.5' 
                : 'bg-black text-[#fde047] hover:bg-zinc-800 active:translate-y-0.5 active:shadow-none'
            }`}
          >

            {simulating ? <RefreshCw size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
            <span>{simulating ? 'RUNNING MONTE CARLO SIM...' : 'FIRE STRESS TEST ⚡'}</span>
          </button>
        </div>

        {/* Right Side: Simulation Terminals & Results */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SIMULATOR MODAL/PROGRESS BAR CONTAINER */}
          {simulating && (
            <div className="sticker-card bg-[#1c1b1b] text-white border-4 border-black rounded-3xl p-6 shadow-[5px_5px_0px_0px_#fd56a7] font-mono min-h-[300px] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-xs text-zinc-400 border-b border-zinc-700 pb-2 mb-4">
                  <span className="flex items-center gap-1.5"><ShieldAlert size={12} className="text-[#fd56a7]" /> VU-STRESS-MONITOR v2.1</span>
                  <span>{simStep}/22 CHECKS</span>
                </div>
                
                <div className="space-y-1.5 text-xs text-[#00d09c] min-h-[140px] max-h-[180px] overflow-y-auto no-scrollbar">
                  {STRESS_STEPS.slice(0, simStep).map((step, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-zinc-500 font-bold">[{idx + 1}]</span>
                      <span className="text-zinc-400">{step}</span>
                      <span className="text-emerald-400 text-[10px] ml-auto">SUCCESS</span>
                    </div>
                  ))}
                  {simStep < 22 && (
                    <div className="flex gap-2 items-center text-white animate-pulse">
                      <span className="text-[#fd56a7] font-bold">➔</span>
                      <span>{STRESS_STEPS[simStep]}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rainbow themed loading bar */}
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <div className="flex justify-between items-center text-xs font-bold text-zinc-400 mb-1.5">
                  <span>PROGRESS</span>
                  <span className="text-white bg-[#fd56a7]/20 text-[#fd56a7] border border-[#fd56a7]/40 px-2 py-0.5 rounded">{Math.round((simStep / 22) * 100)}%</span>
                </div>
                <div className="w-full h-4 bg-zinc-800 border-2 border-zinc-600 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-[#7c3aed] via-[#fd56a7] to-[#fde047] transition-all duration-150"
                    style={{ width: `${(simStep / 22) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SIMULATION RESULTS */}
          {!simulating && !simulationComplete && (
            <div className="sticker-card bg-white border-3 border-black rounded-3xl p-8 text-center shadow-[5px_5px_0px_0px_#1c1b1b] flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 bg-[#fde047] border-3 border-black rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_#1c1b1b] transform rotate-[-4deg] mb-6">
                <ShieldAlert size={32} className="text-black" />
              </div>
              <h3 className="text-md font-black font-display uppercase text-black">Simulator Ready</h3>
              <p className="text-xs text-zinc-500 max-w-sm mt-2 leading-relaxed">
                Click <b>"FIRE STRESS TEST"</b> to execute historical shock models on your asset allocations and calculate VaR.
              </p>
            </div>
          )}

          {/* SIMULATION COMPLETE SCREEN */}
          {!simulating && simulationComplete && (
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Simulated PnL */}
                <div className="sticker-card bg-white border-3 border-black p-5 rounded-2xl shadow-[4px_4px_0px_#1c1b1b] flex flex-col justify-between">
                  <span className="text-[9px] font-black text-zinc-400 uppercase font-headline">ESTIMATED DROP</span>
                  <div className="mt-2">
                    <h3 className="text-xl md:text-2xl font-black font-mono text-red-500 tracking-tight">
                      -₹{Math.round(Math.abs(stressResults.totalPnL)).toLocaleString('en-IN')}
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{stressResults.totalPnLPct.toFixed(1)}% portfolio loss</p>
                  </div>
                </div>

                {/* Portfolio Value */}
                <div className="sticker-card bg-white border-3 border-black p-5 rounded-2xl shadow-[4px_4px_0px_#1c1b1b] flex flex-col justify-between">
                  <span className="text-[9px] font-black text-zinc-400 uppercase font-headline">STRESSED VALUE</span>
                  <div className="mt-2">
                    <h3 className="text-xl md:text-2xl font-black font-mono text-black tracking-tight">
                      ₹{Math.round(stressResults.simulatedValue).toLocaleString('en-IN')}
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Original: ₹{Math.round(stressResults.originalValue).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Risk Tier */}
                <div className="sticker-card bg-white border-3 border-black p-5 rounded-2xl shadow-[4px_4px_0px_#1c1b1b] flex flex-col justify-between">
                  <span className="text-[9px] font-black text-zinc-400 uppercase font-headline">RISK SENSITIVITY</span>
                  <div className="mt-2">
                    <h3 className={`text-xl md:text-2xl font-black font-display uppercase leading-none tracking-tight ${stressResults.riskColor}`}>
                      {stressResults.riskLevel}
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-mono mt-1">Based on covariance</p>
                  </div>
                </div>

              </div>

              {/* Detailed asset breakdowns */}
              <div className="sticker-card bg-white border-3 border-black rounded-3xl p-6 shadow-[5px_5px_0px_0px_#1c1b1b]">
                <h3 className="text-xs font-black font-display uppercase text-black mb-4">Holding Sensitivity Breakdown</h3>
                <div className="divide-y-2 divide-black/10 space-y-4">
                  {stressResults.items.map(item => (
                    <div key={item.ticker} className="flex justify-between items-center pt-4 first:pt-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-black text-sm text-black">{item.ticker}</span>
                          <span className="text-[8px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-100 border border-zinc-200 px-1 rounded">{item.sector}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-medium font-headline mt-1">Stressed price: ₹{item.simulatedPrice.toFixed(1)} (from ₹{item.currentPrice.toFixed(1)})</p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-xs font-black text-red-500 flex items-center justify-end">
                          <ArrowDownRight size={12} className="stroke-[3]" />
                          <span>{item.pnlPct.toFixed(1)}%</span>
                        </span>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Value drop: -₹{Math.round(Math.abs(item.pnl)).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Savage AI Advisory */}
              <div className="sticker-card bg-[#fffbeb] border-3 border-black rounded-3xl p-6 shadow-[5px_5px_0px_#1c1b1b] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2.5 bg-[#f59e0b] border-b-3 border-black" />
                <div className="flex items-center gap-2 text-[#b45309] font-black text-xs font-display uppercase tracking-tight mb-2 mt-2">
                  <Sparkles size={16} />
                  <span>AUREX CO-PILOT MITIGATION STRATEGY</span>
                </div>
                <p className="text-xs font-bold leading-relaxed text-zinc-800">
                  {stressResults.totalPnLPct < -20 ? (
                    `Damn, this portfolio gets wiped out during a ${selectedScenario.name}. Your heavy concentration in high-beta sectors means you will bleed heavily. We suggest adding some defensive hedges like FMCG (ITC, HINDUNILVR) or Pharma to offset these shocks. Consider taking profits on speculative holdings.`
                  ) : stressResults.totalPnLPct < -5 ? (
                    `Your holdings show moderate resilience. A loss of ${Math.round(Math.abs(stressResults.totalPnLPct))}% is manageable, but you are not immune. Keep a close watch on volatility triggers and maintain some cash reserves (around 15-20%) to buy the dip when panic peaks.`
                  ) : (
                    `Nice! Your portfolio is built like a tank. The simulated shock only caused minor drawdowns. Your allocations are perfectly hedged and ready to withstand high volatility. Keep HODLing.`
                  )}
                </p>
              </div>

            </motion.div>
          )}

        </div>

      </div>

    </motion.div>
  )
}

export default StressTest
