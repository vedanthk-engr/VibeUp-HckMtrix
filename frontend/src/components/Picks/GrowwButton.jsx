import React, { useState } from 'react'
import { ExternalLink } from 'lucide-react'

export function GrowwButton({ symbol, action = 'buy', className = '' }) {
  const [showToast, setShowToast] = useState(false)
  const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '').toLowerCase()
  const growwUrl = `https://groww.in/stocks/${cleanSymbol}?utm_source=vibeup&utm_medium=app`

  const handleClick = (e) => {
    e.stopPropagation()
    setShowToast(true)
    
    setTimeout(() => {
      window.open(growwUrl, '_blank')
      setShowToast(false)
    }, 2000)
  }

  return (
    <div className="relative inline-block w-full">
      <button
        onClick={handleClick}
        className={`
          flex items-center justify-center gap-2 
          w-full py-3.5 px-4 rounded-xl 
          bg-[#00d09c] text-black font-extrabold font-headline text-sm
          border-3 border-black 
          shadow-[4px_4px_0px_0px_#1c1b1b]
          hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#1c1b1b]
          active:translate-x-1 active:translate-y-1 active:shadow-[0px_0px_0px_0px_#1c1b1b]
          transition-all duration-100 cursor-pointer uppercase tracking-wider
          ${className}
        `}
      >
        <span>Trade on Groww</span>
        <ExternalLink size={14} />
      </button>

      {/* Floating disclaimer alert styled as zine doodle */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-100 bg-white border-4 border-black rounded-xl p-4 shadow-[8px_8px_0px_0px_#1c1b1b] flex items-center gap-4 animate-bounce">
          <div className="w-12 h-12 bg-[#00d09c] rounded-full flex items-center justify-center font-bold text-white border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xl transform -rotate-6">G</div>
          <div className="text-left">
            <p className="font-bold text-[#1c1b1b] text-base leading-tight">Opening Groww 🚀</p>
            <p className="text-xs font-bold text-zinc-500">trades are yours to make.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default GrowwButton
