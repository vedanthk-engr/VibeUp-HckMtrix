import React from 'react'
import { Sparkles, BarChart2, TrendingUp, HelpCircle, Flame } from 'lucide-react'

export function QuickChips({ onSelectChip }) {
  const chips = [
    { text: 'Why is Nifty moving today? 📊', icon: BarChart2, color: 'hover:bg-rainbow-4' },
    { text: 'Roast my portfolio 💀', icon: Sparkles, color: 'hover:bg-rainbow-3' },
    { text: 'Best mutual fund SIP for ₹5k/mo 📈', icon: TrendingUp, color: 'hover:bg-rainbow-5' },
    { text: 'Explain Options Trading like I\'m 5 🍼', icon: HelpCircle, color: 'hover:bg-rainbow-1' },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 w-full max-w-xl mx-auto py-6">
      {chips.map((chip, index) => {
        const Icon = chip.icon
        return (
          <button
            key={index}
            onClick={() => onSelectChip(chip.text)}
            className={`
              flex items-center gap-3 p-3.5 rounded-xl border-3 border-black bg-white
              text-left text-xs font-bold text-black font-headline shadow-[4px_4px_0px_0px_#1c1b1b]
              hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#1c1b1b] active:translate-y-1 active:shadow-[0px_0px_0px_0px_#1c1b1b]
              transition-all cursor-pointer select-none group ${chip.color}
            `}
          >
            <Icon size={14} className="text-black group-hover:scale-110 transition-transform" />
            <span className="truncate">{chip.text}</span>
          </button>
        )
      })}
    </div>
  )
}

export default QuickChips

