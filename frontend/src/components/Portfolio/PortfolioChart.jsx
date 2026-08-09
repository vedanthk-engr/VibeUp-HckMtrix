import React, { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Landmark, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'

export function PortfolioChart({ historyData = [], currentVal = 0 }) {
  const [timeframe, setTimeframe] = useState('1M')

  // Generate detailed daily/weekly points backward from currentVal
  const chartData = useMemo(() => {
    const val = currentVal > 0 ? currentVal : 50000 // default mock baseline if empty
    const points = []
    let length = 30
    let variance = 0.015
    let drift = 0.003 // general upward market drift
    
    if (timeframe === '1W') {
      length = 7
      variance = 0.01
    } else if (timeframe === '1M') {
      length = 30
      variance = 0.015
    } else if (timeframe === '3M') {
      length = 90
      variance = 0.02
    } else if (timeframe === '1Y') {
      length = 52
      variance = 0.028
    } else if (timeframe === 'ALL') {
      length = 150
      variance = 0.035
    }

    let current = val
    const now = new Date()
    
    // Random walk backwards
    for (let i = length - 1; i >= 0; i--) {
      const date = new Date(now)
      if (timeframe === '1Y') {
        date.setDate(now.getDate() - i * 7)
      } else {
        date.setDate(now.getDate() - i)
      }
      
      const formattedDate = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      points.push({
        rawDate: date,
        date: formattedDate,
        value: Math.round(current)
      })
      
      // Calculate previous value
      const change = 1 + (Math.random() - 0.46) * variance - drift / length
      current = current / change
    }

    // Sort chronologically and force the last point to match exactly
    const sorted = points.sort((a, b) => a.rawDate - b.rawDate)
    if (sorted.length > 0) {
      sorted[sorted.length - 1].value = Math.round(val)
    }
    return sorted
  }, [timeframe, currentVal])

  // Compute key stats for the current timeframe
  const stats = useMemo(() => {
    if (chartData.length === 0) return { max: 0, min: 0, change: 0 }
    const values = chartData.map(d => d.value)
    const max = Math.max(...values)
    const min = Math.min(...values)
    const start = values[0]
    const end = values[values.length - 1]
    const change = start > 0 ? ((end - start) / start) * 100 : 0
    return { max, min, change }
  }, [chartData])

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-3 border-black rounded-xl p-3 shadow-[3px_3px_0px_#1c1b1b] text-left">
          <p className="text-[9px] text-zinc-500 font-headline font-extrabold uppercase tracking-widest">Valuation</p>
          <p className="text-sm font-bold font-mono text-black mt-0.5">₹{payload[0].value.toLocaleString('en-IN')}</p>
          <p className="text-[8px] text-zinc-400 font-bold font-mono mt-1">{payload[0].payload.date}</p>
        </div>
      )
    }
    return null
  }

  // Calculate dynamic boundaries for YAxis
  const yMin = stats.min
  const yMax = stats.max
  const yPadding = (yMax - yMin) * 0.1 || 1000
  const domainMin = Math.max(0, yMin - yPadding)
  const domainMax = yMax + yPadding

  return (
    <div className="sticker-card bg-white p-5 md:p-6 relative w-full overflow-hidden border-3 border-black shadow-[6px_6px_0px_#1c1b1b] transform -rotate-[0.5deg]">
      
      {/* Header Panel */}
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4 border-b-3 border-black border-dashed pb-4">
        <div className="text-left font-headline">
          <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
            <Landmark size={12} className="stroke-[2.5]" />
            <span>GROWTH CURVE</span>
          </span>
          <h3 className="text-xl font-extrabold text-black font-display mt-0.5 uppercase tracking-tight">Performance</h3>
        </div>

        {/* Timeframe Selector tabs */}
        <div className="flex gap-1 bg-zinc-100 border-2 border-black rounded-xl p-1 shadow-[2px_2px_0px_#1c1b1b] transform rotate-1">
          {['1W', '1M', '3M', '1Y', 'ALL'].map((tf) => {
            const isActive = timeframe === tf
            return (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`
                  px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer text-[9px] font-headline
                  ${isActive 
                    ? 'bg-[#1c1b1b] text-white' 
                    : 'text-zinc-600 hover:text-black'
                  }
                `}
              >
                {tf}
              </button>
            )
          })}
        </div>
      </div>

      {/* Timeframe Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6 bg-zinc-50 border-2 border-black rounded-2xl p-3 shadow-inner">
        <div className="text-center">
          <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider block">Peak</span>
          <span className="font-mono text-xs font-bold text-black">₹{stats.max.toLocaleString('en-IN')}</span>
        </div>
        <div className="text-center border-l border-r border-zinc-300">
          <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider block">Floor</span>
          <span className="font-mono text-xs font-bold text-black">₹{stats.min.toLocaleString('en-IN')}</span>
        </div>
        <div className="text-center">
          <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider block">Return</span>
          <span className={`font-mono text-xs font-bold flex items-center justify-center gap-0.5 ${stats.change >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
            {stats.change >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Detailed Chart Canvas */}
      <div className="h-64 w-full select-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={stats.change >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={stats.change >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e2e1" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#1c1b1b" 
              tick={{ fill: '#1c1b1b', fontFamily: 'JetBrains Mono', fontSize: 8, fontWeight: 'bold' }} 
              axisLine={{ strokeWidth: 3, stroke: '#1c1b1b' }}
              tickLine={{ strokeWidth: 3, stroke: '#1c1b1b' }}
              dy={6}
            />
            <YAxis 
              stroke="#1c1b1b" 
              tick={{ fill: '#1c1b1b', fontFamily: 'JetBrains Mono', fontSize: 8, fontWeight: 'bold' }} 
              axisLine={{ strokeWidth: 3, stroke: '#1c1b1b' }}
              tickLine={{ strokeWidth: 3, stroke: '#1c1b1b' }}
              domain={[domainMin, domainMax]}
              tickFormatter={(v) => `₹${(v/1000).toFixed(1)}k`}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={stats.change >= 0 ? '#10b981' : '#f43f5e'} 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#portfolioGlow)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default PortfolioChart
