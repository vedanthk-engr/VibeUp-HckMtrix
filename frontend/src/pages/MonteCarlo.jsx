import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { AreaChart, Area } from 'recharts'
import { Activity, ShieldAlert, Award, ArrowUpRight, BarChart2, RefreshCw } from 'lucide-react'

export function MonteCarlo() {
  const [initialCapital, setInitialCapital] = useState(10000)
  const [monthlySip, setMonthlySip] = useState(2000)
  const [years, setYears] = useState(5)
  const [targetGoal, setTargetGoal] = useState(500000)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)

  const runSimulation = async () => {
    setLoading(true)
    try {
      const res = await api.get('/forecaster/monte-carlo', {
        params: {
          initial_capital: initialCapital,
          monthly_sip: monthlySip,
          years: years,
          target_goal: targetGoal
        }
      })
      if (res.data) {
        setResults(res.data)
      }
    } catch (err) {
      console.error('Failed to run Monte Carlo forecast:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runSimulation()
  }, [])

  // Formatting large values into clean currency representations (like ₹2.5L)
  const formatCurrency = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`
    return `₹${val}`
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 text-left relative z-10 pb-32">
      {/* Header */}
      <header className="mb-8 relative z-10 select-none">
        <h1 className="font-display text-4xl md:text-5xl font-black mb-2 text-[#1c1b1b] tracking-tighter drop-shadow-[2.5px_2.5px_0px_#fd56a7] uppercase leading-none">
          QUANT WEALTH FORECASTER
        </h1>
        <p className="font-sans text-xs font-bold text-zinc-600 bg-white px-4 py-2 border-2 border-black rounded-lg inline-block transform -rotate-0.5 mt-2 shadow-[2px_2px_0px_#000]">
          Model 1,000 Geometric Brownian Motion (GBM) runs of your portfolio metrics over 10-year timelines.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white border-4 border-black p-6 rounded-3xl shadow-[6px_6px_0px_0px_#1c1b1b] space-y-6">
            <h2 className="text-lg font-black font-display uppercase tracking-tight flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              <span>Telemetry Variables</span>
            </h2>

            {/* Slider 1: Initial Capital */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono text-xs font-black text-black">
                <span>INITIAL CAPITAL</span>
                <span className="text-[#7c3aed]">{formatCurrency(initialCapital)}</span>
              </div>
              <input 
                type="range" 
                min="1000" 
                max="500000" 
                step="5000"
                value={initialCapital}
                onChange={(e) => setInitialCapital(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
            </div>

            {/* Slider 2: Monthly SIP */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono text-xs font-black text-black">
                <span>MONTHLY SIP</span>
                <span className="text-[#7c3aed]">{formatCurrency(monthlySip)}</span>
              </div>
              <input 
                type="range" 
                min="500" 
                max="50000" 
                step="500"
                value={monthlySip}
                onChange={(e) => setMonthlySip(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
            </div>

            {/* Slider 3: Timeline (Years) */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono text-xs font-black text-black">
                <span>TIMELINE (YEARS)</span>
                <span className="text-[#7c3aed]">{years} Years</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                step="1"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
            </div>

            {/* Slider 4: Target Wealth Goal */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono text-xs font-black text-black">
                <span>TARGET GOAL</span>
                <span className="text-[#7c3aed]">{formatCurrency(targetGoal)}</span>
              </div>
              <input 
                type="range" 
                min="10000" 
                max="5000000" 
                step="25000"
                value={targetGoal}
                onChange={(e) => setTargetGoal(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
            </div>

            <button 
              onClick={runSimulation}
              disabled={loading}
              className="w-full py-3 border-3 border-black rounded-xl bg-black text-[#fde047] text-xs font-black uppercase tracking-wider shadow-[4px_4px_0px_#fd56a7] cursor-pointer hover:bg-zinc-800 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin h-4 w-4" />
                  <span>Simulating...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>COMPUTE 1,000 RUNS</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Charts and Results */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Stats Deck */}
          {results && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#ccfbf1] border-3 border-black p-4 rounded-2xl shadow-[3px_3px_0px_#000] text-black">
                <span className="font-mono text-[8px] font-black text-teal-800 uppercase block mb-1">Success Probability</span>
                <span className="font-mono text-lg font-black text-teal-900">{results.success_probability}%</span>
              </div>
              <div className="bg-[#fffbeb] border-3 border-black p-4 rounded-2xl shadow-[3px_3px_0px_#000] text-black">
                <span className="font-mono text-[8px] font-black text-amber-800 uppercase block mb-1">Median Forecast</span>
                <span className="font-mono text-lg font-black text-amber-900">{formatCurrency(results.projected_median)}</span>
              </div>
              <div className="bg-[#f3e8ff] border-3 border-black p-4 rounded-2xl shadow-[3px_3px_0px_#000] text-black">
                <span className="font-mono text-[8px] font-black text-purple-800 uppercase block mb-1">Best Case (90th)</span>
                <span className="font-mono text-lg font-black text-purple-900">{formatCurrency(results.projected_best)}</span>
              </div>
              <div className="bg-[#ffe4e6] border-3 border-black p-4 rounded-2xl shadow-[3px_3px_0px_#000] text-black">
                <span className="font-mono text-[8px] font-black text-rose-800 uppercase block mb-1">Total Capital Invested</span>
                <span className="font-mono text-lg font-black text-rose-900">{formatCurrency(results.total_invested)}</span>
              </div>
            </div>
          )}

          {/* Line Chart */}
          <div className="bg-white border-4 border-black p-6 rounded-3xl shadow-[6px_6px_0px_0px_#1c1b1b] flex flex-col h-[320px] relative">
            <h3 className="font-mono text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Geometric Brownian Motion Projections</h3>
            
            <div className="flex-1 w-full text-xs font-mono">
              {loading ? (
                <div className="h-full flex items-center justify-center text-zinc-400 animate-pulse uppercase">
                  Recalculating stochastic parameters...
                </div>
              ) : (
                results && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={results.chart_data}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="#000" />
                      <XAxis dataKey="year" stroke="#000" strokeWidth={1.5} tickFormatter={(y) => `${y} Yr`} />
                      <YAxis stroke="#000" strokeWidth={1.5} tickFormatter={(val) => formatCurrency(val)} />
                      <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`]} />
                      <Legend />
                      <Line type="monotone" dataKey="best_case" name="Best Case (90th)" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="median_case" name="Median (50th)" stroke="#00d09c" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="worst_case" name="Worst Case (10th)" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )
              )}
            </div>
          </div>

          {/* Aurex says Roast */}
          {results && (
            <div className="bg-black border-4 border-black p-5 rounded-2xl shadow-[4px_4px_0px_#fd56a7] text-left text-white italic font-bold text-xs relative">
              <span className="text-[8px] font-black text-zinc-500 uppercase block not-italic mb-1 font-headline">AUREX SAYS:</span>
              "{results.roast}"
              <span className="absolute bottom-[-10px] left-8 w-0 h-0 border-x-[8px] border-x-transparent border-t-[10px] border-t-black" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MonteCarlo
