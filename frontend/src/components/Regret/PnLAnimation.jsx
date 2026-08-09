import React, { useEffect, useState } from 'react'

export function PnLAnimation({ value, percentage, isPositive }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const end = Math.abs(value)
    if (end === 0) return

    const duration = 1500 // 1.5 seconds
    const increment = end / (duration / 16) // ~60fps
    
    const counter = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(counter)
      } else {
        setCount(start)
      }
    }, 16)

    return () => clearInterval(counter)
  }, [value])

  return (
    <div className="text-center py-6 flex flex-col items-center">
      <div className="bg-bg-cream border-3 border-black px-6 py-2 shadow-[3px_3px_0px_0px_#1c1b1b] transform -rotate-1 inline-block rounded-xl">
        <span className="text-[10px] text-black font-extrabold uppercase tracking-widest font-headline">If you invested then, you'd have...</span>
      </div>
      
      <h2 
        className={`
          text-4xl md:text-6xl font-extrabold font-display tracking-tight mt-6 transform rotate-1 bg-white border-3 border-black py-4 px-8 inline-block rounded-2xl shadow-[5px_5px_0px_0px_#1c1b1b]
          ${isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'}
        `}
        style={{ WebkitTextStroke: '1.5px #1c1b1b' }}
      >
        {isPositive ? '+' : '-'}₹{Math.round(count).toLocaleString('en-IN')}
      </h2>
      
      <div className={`text-sm font-black font-headline mt-4 ${isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
        ({isPositive ? '+' : ''}{percentage.toFixed(2)}% return)
      </div>
    </div>
  )
}

export default PnLAnimation

