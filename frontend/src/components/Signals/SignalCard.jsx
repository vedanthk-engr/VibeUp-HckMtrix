import React, { useMemo } from 'react'
import { PillBadge } from '../shared/PillBadge'
import { GrowwButton } from '../Picks/GrowwButton'
import { useVibeStore } from '../../store/vibeStore'
import { MessageSquareCode, Heart, ArrowUpRight, ArrowDownRight } from 'lucide-react'

import ModelBadge from '../shared/ModelBadge'

export function SignalCard({ signal, onSelectChart }) {
  const { watchlist, toggleWatchlist, setActivePage, setActiveDebateTicker, unlockCard } = useVibeStore()
  const isUp = signal.change >= 0
  const isWatchlisted = watchlist.includes(signal.ticker.toUpperCase())

  // Procedural SVG sparkline
  const sparklinePoints = useMemo(() => {
    let hash = 0
    for (let i = 0; i < signal.ticker.length; i++) {
      hash = signal.ticker.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    const points = []
    const base = signal.price
    const count = 10
    
    for (let i = 0; i < count; i++) {
      const noise = Math.sin(hash + i * 2) * (base * 0.02)
      const trend = (i / count) * (signal.change / 100) * base
      points.push(base - (signal.change / 100) * base + trend + noise)
    }
    
    const min = Math.min(...points)
    const max = Math.max(...points)
    const range = max - min || 1
    
    const coords = points.map((p, idx) => {
      const x = (idx / (count - 1)) * 120
      const y = 32 - ((p - min) / range) * 28 - 2
      return `${x},${y}`
    }).join(' ')
    
    return coords
  }, [signal.ticker, signal.price, signal.change])

  const confidenceColor = (val) => {
    if (val < 40) return 'bg-[#ef4444]'
    if (val < 70) return 'bg-[#fde047]'
    return 'bg-[#10b981]'
  }

  const handleDebate = () => {
    if (setActiveDebateTicker) {
      setActiveDebateTicker(signal.ticker)
    }
    // Attempt to unlock a card for debating this stock
    if (unlockCard) unlockCard(signal.ticker)
    setActivePage('debate')
  }

  return (
    <div className="bg-white border-3 border-black rounded-2xl p-6 relative w-full flex flex-col justify-between overflow-hidden shadow-[6px_6px_0px_#1c1b1b] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#1c1b1b] transition-all">
      
      {/* Decorative vertical color line indicator */}
      <div className={`absolute left-0 top-0 bottom-0 w-2.5 border-r-3 border-black ${signal.signal_type === 'ACT' ? 'bg-[#10b981]' : 'bg-[#fde047]'}`} />

      {/* Ticker / Type Badge */}
      <div className="flex justify-between items-center gap-3 pl-2">
        <div className="flex items-center gap-2">
          <span 
            onClick={() => onSelectChart && onSelectChart(signal.ticker)}
            className="text-2xl font-display font-black text-[#1c1b1b] cursor-pointer hover:underline"
          >
            {signal.ticker}
          </span>
          <span className="text-[9px] font-black bg-white border-2 border-black px-1.5 py-0.2 rounded-md shadow-[2px_2px_0px_#1c1b1b]">NSE</span>
        </div>
        <div className="flex items-center gap-2">
          <PillBadge>{signal.signal_type}</PillBadge>
          <ModelBadge model="gemma" />
        </div>
      </div>

      {/* Price Sparkline */}
      <div className="flex justify-between items-center gap-4 mt-4 border-b-2 border-black border-dashed pb-4 pl-2">
        <div className="text-left">
          <div className="text-2xl font-bold font-mono text-[#1c1b1b]">₹{signal.price.toLocaleString('en-IN')}</div>
          <div className={`flex items-center text-xs font-black font-mono ${isUp ? 'text-[#2e7d32]' : 'text-[#c62828]'} mt-0.5`}>
            {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            <span>{isUp ? '+' : ''}{signal.change.toFixed(2)}%</span>
          </div>
        </div>

        {/* SVG Sparkline */}
        <div className="h-8 w-28 pr-1 shrink-0 bg-zinc-50 border-2 border-black rounded-lg overflow-hidden flex items-center p-1">
          <svg className="h-full w-full overflow-visible">
            <polyline
              fill="none"
              stroke={isUp ? '#10b981' : '#ef4444'}
              strokeWidth="3"
              points={sparklinePoints}
            />
          </svg>
        </div>
      </div>

      {/* Reasoning text */}
      <div className="text-left py-4 pl-2">
        <p className="text-zinc-800 text-xs font-bold leading-relaxed font-sans italic">"{signal.reasoning}"</p>
      </div>

      {/* Source Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 pl-2">
        {signal.sources && signal.sources.map((src, i) => (
          <span 
            key={i} 
            className="text-[9px] font-bold text-black bg-white px-2 py-0.5 rounded-full border-2 border-black shadow-[2px_2px_0px_#1c1b1b] whitespace-nowrap"
          >
            {src}
          </span>
        ))}
      </div>

      {/* Confidence gauge bar */}
      <div className="border-t-2 border-black border-dashed pt-3 pl-2">
        <div className="flex justify-between text-[10px] font-bold text-zinc-600 mb-1.5 uppercase">
          <span>AI Conviction Rate</span>
          <span className="font-mono text-black font-black">{signal.confidence}%</span>
        </div>
        <div className="w-full h-4 bg-zinc-100 rounded-full border-2 border-black overflow-hidden relative">
          <div 
            className={`h-full border-r-2 border-black transition-all duration-500 ${confidenceColor(signal.confidence)}`}
            style={{ width: `${signal.confidence}%` }}
          />
        </div>
      </div>

      {/* Interactive Actions Grid */}
      <div className="grid grid-cols-2 gap-3 mt-5 pl-2">
        <button
          onClick={() => {
            toggleWatchlist(signal.ticker)
            // Attempt to unlock a card for watchlisting this stock
            if (!isWatchlisted && unlockCard) unlockCard(signal.ticker)
          }}
          className={`
            flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border-2 border-black text-xs font-bold font-headline shadow-[3px_3px_0px_#1c1b1b] active:translate-y-1 active:shadow-[0px_0px_0px_#1c1b1b] transition-all cursor-pointer
            ${isWatchlisted 
              ? 'bg-rose-100 text-rose-800' 
              : 'bg-white text-zinc-800 hover:bg-zinc-50'
            }
          `}
        >
          <Heart size={12} className={isWatchlisted ? 'fill-rose-600 text-rose-600' : ''} />
          <span>{isWatchlisted ? 'In Watchlist' : 'Add Watchlist'}</span>
        </button>

        <button
          onClick={handleDebate}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border-2 border-black bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-bold font-headline shadow-[3px_3px_0px_#1c1b1b] active:translate-y-1 active:shadow-[0px_0px_0px_#1c1b1b] transition-all cursor-pointer"
        >
          <MessageSquareCode size={12} className="text-[#630ed4]" />
          <span>Debate stock</span>
        </button>
      </div>

      {/* Trade Broker Button */}
      <div className="mt-4 pl-2">
        <GrowwButton symbol={signal.ticker} />
      </div>
    </div>
  )
}

export default SignalCard

