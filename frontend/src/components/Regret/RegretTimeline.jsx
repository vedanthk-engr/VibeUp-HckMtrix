import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'

export function RegretTimeline({ chartData = [], ticker, isPositive }) {
  const formattedData = chartData.map(item => ({
    date: new Date(item.time).toLocaleDateString('en-IN', { year: '2-digit', month: 'short' }),
    value: item.value
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-3 border-black rounded-xl p-3.5 shadow-[4px_4px_0px_0px_#1c1b1b] text-left">
          <p className="text-[10px] text-zinc-500 font-headline font-extrabold uppercase tracking-widest">{ticker} Price</p>
          <p className="text-sm font-bold font-mono text-black mt-0.5">₹{payload[0].value.toFixed(2)}</p>
          <p className="text-[9px] text-zinc-400 mt-1 font-sans">{payload[0].payload.date}</p>
        </div>
      )
    }
    return null
  }

  // Get first point for "You Skipped" annotation
  const firstPoint = formattedData[0]

  return (
    <div className="w-full h-56 border-3 border-black bg-white rounded-3xl p-4 overflow-hidden relative shadow-[4px_4px_0px_0px_#1c1b1b]">
      <div className="absolute top-2 left-4 text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold font-headline z-10">
        Timeline Price Curve (₹)
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 25, right: 25, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e2e1" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#1c1b1b" 
            tick={{ fill: '#1c1b1b', fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 'bold' }} 
            axisLine={{ strokeWidth: 3, stroke: '#1c1b1b' }}
            tickLine={{ strokeWidth: 3, stroke: '#1c1b1b' }}
          />
          <YAxis 
            stroke="#1c1b1b" 
            tick={{ fill: '#1c1b1b', fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 'bold' }} 
            axisLine={{ strokeWidth: 3, stroke: '#1c1b1b' }}
            tickLine={{ strokeWidth: 3, stroke: '#1c1b1b' }}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `₹${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={isPositive ? '#10b981' : '#ef4444'} 
            strokeWidth={5} 
            dot={{ r: 6, fill: '#ffffff', stroke: '#1c1b1b', strokeWidth: 3 }}
            activeDot={{ r: 8, fill: '#fde047', stroke: '#1c1b1b', strokeWidth: 3 }}
          />
          {firstPoint && (
            <ReferenceDot 
              x={firstPoint.date} 
              y={firstPoint.value} 
              r={8} 
              fill="#ba1a1a" 
              stroke="#1c1b1b" 
              strokeWidth={3} 
              label={{ position: 'top', value: 'You Skipped', fill: '#1c1b1b', fontWeight: 'bold', fontFamily: 'Syne', fontSize: 11 }} 
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default RegretTimeline

