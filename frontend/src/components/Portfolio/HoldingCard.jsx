import React from 'react'
import { useVibeStore } from '../../store/vibeStore'
import { Trash2, ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react'

export function HoldingCard({ holding }) {
  const { deleteHolding } = useVibeStore()

  const isPositive = holding.pnl >= 0
  const currentVal = holding.quantity * holding.current_price

  const handleSellClick = (e) => {
    e.stopPropagation()
    const cleanSymbol = holding.ticker.toLowerCase()
    const url = `https://groww.in/stocks/${cleanSymbol}?utm_source=vibeup&utm_medium=app`
    
    alert(`Opening Groww interface. VibeUp is directing you to Groww to sell ${holding.ticker}. We do not execute broker orders.`)
    window.open(url, '_blank')
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (confirm(`Remove ${holding.ticker} from watchlist/portfolio?`)) {
      deleteHolding(holding.id)
    }
  }

  return (
    <div className="sticker-card bg-white p-5 flex flex-col justify-between overflow-hidden relative border-3 border-black shadow-[4px_4px_0px_0px_#1c1b1b] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#1c1b1b] transition-all">
      {/* Top Section */}
      <div className="flex justify-between items-start gap-4">
        <div className="text-left font-headline">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-lg font-extrabold text-black font-display tracking-tight">{holding.ticker}</span>
            <span className="text-[8px] text-zinc-500 bg-bg-cream border-2 border-black px-1.5 py-0.2 rounded font-mono font-bold">{holding.exchange || 'NSE'}</span>
            {holding.is_paper && (
              <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-rainbow-4 border-2 border-black text-black">PAPER</span>
            )}
          </div>
          <p className="text-[10px] text-zinc-500 font-bold mt-1">
            {holding.quantity} shares @ ₹{holding.avg_buy_price.toFixed(2)}
          </p>
        </div>
        
        {/* Delete Position Button */}
        <button
          onClick={handleDelete}
          className="text-zinc-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-zinc-100 cursor-pointer border border-transparent hover:border-black transition-all"
        >
          <Trash2 size={13} className="stroke-[2.5]" />
        </button>
      </div>

      {/* Valuation block */}
      <div className="grid grid-cols-2 gap-4 border-t-3 border-dashed border-black pt-4 mt-4 text-left font-headline">
        <div>
          <span className="text-[8px] text-zinc-400 uppercase tracking-widest font-extrabold block">Current Value</span>
          <p className="text-sm font-black font-mono text-black mt-0.5">₹{currentVal.toLocaleString('en-IN')}</p>
        </div>
        
        {/* Returns */}
        <div className="text-right">
          <span className="text-[8px] text-zinc-400 uppercase tracking-widest font-extrabold block">Total P&L</span>
          <div className={`flex items-center text-sm font-black font-mono ${isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'} mt-0.5 justify-end`}>
            {isPositive ? <ArrowUpRight size={14} className="stroke-[3]" /> : <ArrowDownRight size={14} className="stroke-[3]" />}
            <span>₹{Math.abs(Math.round(holding.pnl)).toLocaleString('en-IN')}</span>
          </div>
          <span className={`text-[8px] font-bold block ${isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
            ({isPositive ? '+' : ''}{holding.pnl_percentage.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Sell Action */}
      <div className="mt-4 pt-1 flex w-full">
        <button
          onClick={handleSellClick}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-groww-green text-white border-2 border-black text-xs font-bold font-headline shadow-[2px_2px_0px_0px_#1c1b1b] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#1c1b1b] active:translate-y-[1px] active:shadow-[0px_0px_0px_0px_#1c1b1b] transition-all cursor-pointer"
        >
          <span>Sell on Groww</span>
          <ExternalLink size={12} className="stroke-[3]" />
        </button>
      </div>
    </div>
  )
}

export default HoldingCard

