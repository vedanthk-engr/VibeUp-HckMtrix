import React from 'react'

export function RainbowRibbon({ className = '' }) {
  return (
    <div className={`absolute pointer-events-none select-none overflow-hidden opacity-30 z-0 ${className}`}>
      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 100">
        <path d="M -100,20 C 300,50 400,90 1100,30" fill="none" stroke="#fd56a7" strokeLinecap="round" strokeWidth="24" />
        <path d="M -100,40 C 300,70 400,110 1100,50" fill="none" stroke="#7c3aed" strokeLinecap="round" strokeWidth="24" />
        <path d="M -100,60 C 300,90 400,130 1100,70" fill="none" stroke="#fde047" strokeLinecap="round" strokeWidth="24" />
      </svg>
    </div>
  )
}

export default RainbowRibbon
