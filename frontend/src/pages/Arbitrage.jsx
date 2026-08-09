import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useVibeStore } from '../store/vibeStore'
import { Terminal, RefreshCw, Zap, ShieldCheck, Play, AlertOctagon, Sliders, DollarSign, Award, Percent, Flame } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis as ChartXAxis, YAxis as ChartYAxis, Tooltip as ChartTooltip } from 'recharts'

export function Arbitrage() {
  const { awardXP, user } = useVibeStore()
  const [loading, setLoading] = useState(false)
  const [opportunities, setOpportunities] = useState([])
  const [executingTicker, setExecutingTicker] = useState(null)
  const [consoleLogs, setConsoleLogs] = useState([])
  const [currentLogIndex, setCurrentLogIndex] = useState(0)
  
  const [activeTab, setActiveTab] = useState('live') // live | playground
  
  // Strategy backtesting states
  const [minSpread, setMinSpread] = useState(0.25)
  const [slippage, setSlippage] = useState(0.05)
  const [poolSize, setPoolSize] = useState(1000000)
  const [gasLimit, setGasLimit] = useState(150000)
  const [backtesting, setBacktesting] = useState(false)
  const [backtestResults, setBacktestResults] = useState(null)
  
  const runBacktest = async () => {
    setBacktesting(true)
    setBacktestResults(null)
    try {
      const res = await api.post('/arbitrage/backtest', {
        min_spread: parseFloat(minSpread),
        slippage_tolerance: parseFloat(slippage),
        pool_size: parseFloat(poolSize),
        gas_limit: parseInt(gasLimit),
        user_id: user?.id || 'default_user'
      })
      if (res.data) {
        setBacktestResults(res.data)
        awardXP('arbitrage_backtest', 50)
      }
    } catch (err) {
      console.error("Backtest failed:", err)
    } finally {
      setBacktesting(false)
    }
  }
  
  const fetchSpreads = async () => {
    setLoading(true)
    try {
      const res = await api.get('/arbitrage/live')
      if (res.data) {
        setOpportunities(res.data)
      }
    } catch (err) {
      console.error('Failed to scan spreads:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSpreads()
  }, [])

  const runArbitrage = async (ticker) => {
    setExecutingTicker(ticker)
    setConsoleLogs([])
    setCurrentLogIndex(0)
    
    try {
      const res = await api.post(`/arbitrage/execute?ticker=${ticker}&user_id=${user?.id || 'default_user'}`)
      if (res.data && res.data.logs) {
        const logs = res.data.logs
        
        // Simulating progressive terminal logging
        let idx = 0
        const interval = setInterval(() => {
          const currentLog = logs[idx]
          setConsoleLogs(prev => [...prev, currentLog])
          idx++
          if (idx >= logs.length) {
            clearInterval(interval)
            setExecutingTicker(null)
            awardXP('arbitrage_executed', 35)
            fetchSpreads() // Refresh spreads to show updated prices
          }
        }, 600)
      }
    } catch (err) {
      console.error('Flash loan execution failed:', err)
      setExecutingTicker(null)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 text-left relative z-10 pb-32">
      {/* Header */}
      <header className="mb-8 relative z-10 select-none">
        <h1 className="font-display text-4xl md:text-5xl font-black mb-2 text-[#1c1b1b] tracking-tighter drop-shadow-[2.5px_2.5px_0px_#fde047] uppercase leading-none">
          HFT ARBITRAGE SCANNER
        </h1>
        <p className="font-sans text-xs font-bold text-zinc-600 bg-white px-4 py-2 border-2 border-black rounded-lg inline-block transform rotate-0.5 mt-2 shadow-[2px_2px_0px_#000]">
          Scan NSE vs BSE spreads, evaluate exchange STT margins, and execute simulated smart contract flash loans.
        </p>
      </header>

      {/* Tab Switcher */}
      <div className="flex gap-6 mb-8 border-b-4 border-black pb-3 select-none font-display">
        <button
          onClick={() => setActiveTab('live')}
          className={`text-xl font-extrabold cursor-pointer transition-all ${activeTab === 'live' ? 'text-black relative' : 'text-zinc-400 hover:text-zinc-650'}`}
        >
          Live Spreads Scanner 📡
          {activeTab === 'live' && <div className="absolute -bottom-[16px] left-0 w-full h-2.5 bg-[#fde047] rounded-t-md" />}
        </button>
        <button
          onClick={() => setActiveTab('playground')}
          className={`text-xl font-extrabold cursor-pointer transition-all ${activeTab === 'playground' ? 'text-black relative' : 'text-zinc-400 hover:text-zinc-650'}`}
        >
          Strategy Backtester 🧪
          {activeTab === 'playground' && <div className="absolute -bottom-[16px] left-0 w-full h-2.5 bg-[#7c3aed] rounded-t-md" />}
        </button>
      </div>

      {activeTab === 'live' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Opportunities Table */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white border-4 border-black p-6 rounded-3xl shadow-[6px_6px_0px_0px_#1c1b1b]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black font-display uppercase tracking-tight flex items-center gap-2">
                  <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Live Spreads</span>
                </h2>
                <button 
                  onClick={fetchSpreads}
                  disabled={loading || executingTicker}
                  className="px-3.5 py-1.5 border-2 border-black rounded-xl text-xs font-black uppercase tracking-tight bg-white hover:bg-zinc-50 active:translate-y-0.5 shadow-[2px_2px_0px_#000] cursor-pointer disabled:opacity-40"
                >
                  Scan Now
                </button>
              </div>

              {loading && opportunities.length === 0 ? (
                <div className="py-12 text-center font-mono text-xs font-bold text-zinc-500 animate-pulse">
                  SCANNING HIGH-FREQUENCY TELEMETRY PIPELINES...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs font-bold">
                    <thead>
                      <tr className="border-b-3 border-black text-zinc-500 uppercase tracking-widest text-[9px]">
                        <th className="pb-3">Symbol</th>
                        <th className="pb-3 text-right">NSE / BSE</th>
                        <th className="pb-3 text-right">Spread</th>
                        <th className="pb-3 text-right">Est. Yield</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {opportunities.map((op) => (
                        <tr key={op.ticker} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                          <td className="py-4 font-black font-display text-sm tracking-tight text-black">{op.ticker}</td>
                          <td className="py-4 text-right">
                            <span className="text-teal-700">₹{op.nse_price}</span> / <span className="text-sky-700">₹{op.bse_price}</span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="text-zinc-900">₹{op.spread}</div>
                            <div className="text-[9px] text-zinc-400 font-normal">{op.spread_percentage}%</div>
                          </td>
                          <td className={`py-4 text-right ${op.net_profit > 0 ? 'text-[#00d09c]' : 'text-red-500'}`}>
                            ₹{op.net_profit.toLocaleString()}
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => runArbitrage(op.ticker)}
                              disabled={executingTicker !== null}
                              className={`
                                px-3 py-1.5 border-2 border-black rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none transition-all
                                ${op.net_profit > 0 
                                  ? 'bg-secondary-container text-black hover:bg-[#ffe47a]' 
                                  : 'bg-zinc-100 text-zinc-400 border-zinc-300 shadow-none cursor-not-allowed'
                                }
                              `}
                            >
                              Arbitrage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right: Terminal Logs */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-[#1c1b1b] border-4 border-black p-6 rounded-3xl shadow-[6px_6px_0px_0px_#7c3aed] text-left text-white h-[450px] flex flex-col relative overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3 mb-4 select-none shrink-0">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-[#a78bfa]" />
                  <span className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest">EVM FLASH LOAN SHELL</span>
                </div>
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                </div>
              </div>

              {/* Logs Area */}
              <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2.5 leading-relaxed text-[#7dd3fc] custom-scrollbar pr-2">
                {consoleLogs.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center text-zinc-600 px-6 font-semibold select-none">
                    <Zap size={24} className="stroke-[1.5] mb-2 animate-bounce" />
                    <p className="uppercase tracking-widest text-[9px]">Awaiting High-Frequency execution request</p>
                    <p className="text-[8px] font-normal text-zinc-700 mt-1 max-w-xs lowercase">Select a profitable spread and click 'Arbitrage' to deploy smart contract.</p>
                  </div>
                ) : (
                  consoleLogs.map((log, idx) => {
                    if (!log) return null;
                    let logColor = "text-sky-300";
                    if (log.includes("[SUCCESS]")) logColor = "text-emerald-400";
                    if (log.includes("[PROFIT")) logColor = "text-[#fde047] font-black";
                    if (log.includes("[TRANSACTION REVERTED]")) logColor = "text-rose-400 font-bold";
                    
                    return (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }}
                        className={logColor}
                      >
                        {log}
                      </motion.div>
                    )
                  })
                )}
              </div>

              {/* Status Footer */}
              {executingTicker && (
                <div className="absolute inset-x-0 bottom-0 bg-[#7c3aed] border-t-2 border-black py-2 px-6 flex items-center justify-between font-mono text-[8px] font-black uppercase text-white animate-pulse">
                  <span>Deploying arbitrage payload for {executingTicker}...</span>
                  <RefreshCw className="animate-spin h-3.5 w-3.5" />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Panel: Sliders */}
          <div className="lg:col-span-5 flex flex-col gap-6 select-none">
            <div className="bg-white border-4 border-black p-6 rounded-3xl shadow-[6px_6px_0px_0px_#1c1b1b] text-left text-black">
              <h2 className="text-lg font-black font-display uppercase tracking-tight flex items-center gap-2 mb-6">
                <Sliders size={18} />
                <span>Strategy Config</span>
              </h2>

              <div className="space-y-5 font-sans text-xs font-bold">
                {/* Min Spread */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between font-headline uppercase text-[10px] tracking-wider text-zinc-500">
                    <span>Min Spread Threshold</span>
                    <span className="font-mono text-black">{minSpread}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.50"
                    step="0.05"
                    value={minSpread}
                    onChange={(e) => setMinSpread(parseFloat(e.target.value))}
                    className="w-full accent-black h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Slippage */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between font-headline uppercase text-[10px] tracking-wider text-zinc-500">
                    <span>Slippage Tolerance</span>
                    <span className="font-mono text-black">{slippage}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.50"
                    step="0.01"
                    value={slippage}
                    onChange={(e) => setSlippage(parseFloat(e.target.value))}
                    className="w-full accent-black h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Pool Size */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between font-headline uppercase text-[10px] tracking-wider text-zinc-500">
                    <span>Flash Loan Capital</span>
                    <span className="font-mono text-black">₹{poolSize.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min="100000"
                    max="5000000"
                    step="50000"
                    value={poolSize}
                    onChange={(e) => setPoolSize(parseInt(e.target.value))}
                    className="w-full accent-black h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Gas Limit */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between font-headline uppercase text-[10px] tracking-wider text-zinc-500">
                    <span>Gas Execution Limit</span>
                    <span className="font-mono text-black">{gasLimit.toLocaleString()} units</span>
                  </div>
                  <input
                    type="range"
                    min="50000"
                    max="500000"
                    step="10000"
                    value={gasLimit}
                    onChange={(e) => setGasLimit(parseInt(e.target.value))}
                    className="w-full accent-black h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <button
                  onClick={runBacktest}
                  disabled={backtesting}
                  className="w-full py-4 mt-4 bg-[#7c3aed] text-white border-3 border-black rounded-2xl shadow-[4px_4px_0px_#000] active:translate-y-0.5 active:shadow-none hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#000] transition-all cursor-pointer font-display uppercase tracking-wider font-black text-xs flex justify-center items-center gap-1.5 disabled:opacity-40"
                >
                  <Play size={12} className="fill-white" />
                  <span>{backtesting ? 'Running Simulation...' : 'Run Strategy Backtest'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Results */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-[#1c1b1b] border-4 border-black p-6 rounded-3xl shadow-[6px_6px_0px_0px_#7c3aed] text-left text-white min-h-[460px] flex flex-col justify-between relative overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3 mb-4 select-none shrink-0">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-[#a78bfa]" />
                  <span className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest">STRATEGY DIAGNOSTICS</span>
                </div>
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                </div>
              </div>

              {backtesting ? (
                <div className="flex-1 flex flex-col justify-center items-center py-12 text-center text-zinc-400 font-mono text-[10px] space-y-4">
                  <RefreshCw className="animate-spin h-8 w-8 text-[#a78bfa] mb-2" />
                  <p className="uppercase tracking-widest font-black text-[11px] text-white">Ingesting 30-Day Tick Dataset...</p>
                  <p className="max-w-xs lowercase text-zinc-500">Evaluating spreads against STT duties, slippage barriers, and simulating gas block limits.</p>
                </div>
              ) : !backtestResults ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center text-zinc-500 px-6 py-12 font-sans font-bold">
                  <Zap size={28} className="stroke-[1.5] mb-2 text-yellow-500 animate-bounce" />
                  <p className="uppercase tracking-widest text-[10px] text-zinc-400">Playground Awaiting Launch</p>
                  <p className="text-[8.5px] font-normal text-zinc-650 mt-1 max-w-xs lowercase leading-relaxed">Customize your spread trigger and gas budget parameters on the left, then trigger the EVM simulation pipeline.</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between gap-6 font-sans">
                  
                  {/* Metric grids */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left select-none">
                    <div className="bg-zinc-900 border-2 border-black rounded-xl p-3 shadow-[2.5px_2.5px_0px_#000]">
                      <span className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest block leading-none mb-1">Win Rate</span>
                      <div className="text-sm font-black font-mono text-[#00d09c]">{backtestResults.win_rate}%</div>
                    </div>
                    <div className="bg-zinc-900 border-2 border-black rounded-xl p-3 shadow-[2.5px_2.5px_0px_#000]">
                      <span className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest block leading-none mb-1">Net P&L</span>
                      <div className={`text-sm font-black font-mono ${backtestResults.net_profit >= 0 ? 'text-[#00d09c]' : 'text-rose-400'}`}>
                        ₹{backtestResults.net_profit.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-zinc-900 border-2 border-black rounded-xl p-3 shadow-[2.5px_2.5px_0px_#000]">
                      <span className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest block leading-none mb-1">Reverted</span>
                      <div className="text-sm font-black font-mono text-zinc-300">{backtestResults.reverted_count} trades</div>
                    </div>
                    <div className="bg-zinc-900 border-2 border-black rounded-xl p-3 shadow-[2.5px_2.5px_0px_#000]">
                      <span className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest block leading-none mb-1">Gas Burned</span>
                      <div className="text-sm font-black font-mono text-zinc-300">₹{backtestResults.gas_burned.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Line Chart */}
                  <div className="h-44 w-full bg-zinc-950 border-2 border-black rounded-xl p-2 select-none shadow-[2.5px_2.5px_0px_#000]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={backtestResults.daily_history.reduce((acc, cur, i) => {
                          const lastVal = i > 0 ? acc[i-1].pnl : 0
                          acc.push({
                            day: cur.day,
                            pnl: Math.round(lastVal + cur.pnl)
                          })
                          return acc
                        }, [])}
                        margin={{ top: 5, right: 5, bottom: 5, left: -15 }}
                      >
                        <ChartXAxis dataKey="day" stroke="#52525b" fontSize={8} tickLine={false} />
                        <ChartYAxis stroke="#52525b" fontSize={8} tickLine={false} />
                        <ChartTooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', fontSize: '9px', fontWeight: 'bold' }} />
                        <Line type="monotone" dataKey="pnl" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Roast bubble */}
                  <div className="bg-[#7c3aed]/10 border-2 border-[#7c3aed]/40 rounded-2xl p-3.5 text-left text-violet-300 flex items-start gap-2.5 shadow-[2.5px_2.5px_0px_#000]">
                    <span className="text-lg">🤖</span>
                    <div>
                      <span className="text-[7.5px] font-black text-[#a78bfa] uppercase tracking-wider block mb-0.5">Aurex AI Roast/Flex</span>
                      <p className="text-[9.5px] font-bold leading-relaxed">{backtestResults.slippage_roast}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Arbitrage
