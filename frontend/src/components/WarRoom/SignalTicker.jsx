import React from 'react'
import { Zap } from 'lucide-react'
import { useVibeStore } from '../../store/vibeStore'

export function SignalTicker() {
  const { setActivePage } = useVibeStore()

  // Standard signals for ticker display
  const tickerItems = [
    { ticker: 'ZOMATO', change: '+3.5%', signal: 'ACT', isUp: true },
    { ticker: 'TITAN', change: '+1.2%', signal: 'WATCH', isUp: true },
    { ticker: 'ADANIPORTS', change: '-2.4%', signal: 'NOISE', isUp: false },
    { ticker: 'TATASTEEL', change: '+5.6%', signal: 'ACT', isUp: true },
    { ticker: 'PAYTM', change: '-4.8%', signal: 'AVOID', isUp: false },
    { ticker: 'HAL', change: '+2.1%', signal: 'ACT', isUp: true },
    { ticker: 'INFY', change: '+0.5%', signal: 'WATCH', isUp: true },
  ]

  // Duplicate items to ensure seamless infinite scroll loop
  const scrollItems = [...tickerItems, ...tickerItems, ...tickerItems]

  const handleTickerClick = (ticker) => {
    setActivePage('signals')
  }

  return (
    <div className="w-full bg-zinc-950 border-b border-white/5 py-2 overflow-hidden flex items-center relative z-20">
      {/* Label Badge */}
      <div className="absolute left-0 top-0 bottom-0 bg-zinc-950 px-4 flex items-center gap-1.5 border-r border-white/5 z-20 font-display text-[10px] font-bold text-violet-400 tracking-wider">
        <Zap size={12} className="fill-violet-400" />
        <span>LIVE SIGNALS</span>
      </div>

      {/* Marquee Wrapper */}
      <div className="flex w-full overflow-hidden pl-32">
        <div className="flex gap-8 whitespace-nowrap animate-marquee">
          {scrollItems.map((item, index) => {
            return (
              <button
                key={index}
                onClick={() => handleTickerClick(item.ticker)}
                className="inline-flex items-center gap-2 cursor-pointer text-xs focus:outline-none hover:text-white group transition-colors"
              >
                <span className="font-bold font-display text-white">{item.ticker}</span>
                <span className={item.isUp ? 'text-emerald-400 font-mono' : 'text-red-400 font-mono'}>
                  {item.isUp ? '▲' : '▼'} {item.change}
                </span>
                <span className={`
                  text-[9px] font-semibold px-1.5 py-0.2 rounded border
                  ${item.signal === 'ACT' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40' : ''}
                  ${item.signal === 'WATCH' ? 'bg-amber-950/40 text-amber-400 border-amber-900/40' : ''}
                  ${item.signal === 'NOISE' ? 'bg-zinc-900/40 text-zinc-400 border-zinc-800/40' : ''}
                  ${item.signal === 'AVOID' ? 'bg-red-950/40 text-red-400 border-red-900/40' : ''}
                `}>
                  {item.signal}
                </span>
                <span className="text-zinc-700 mx-2">•</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default SignalTicker
