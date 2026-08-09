import React from 'react'

export function PillBadge({ type, children, className = '' }) {
  const badgeType = (type || children || '').toString().toUpperCase().trim()
  
  let styles = 'bg-zinc-100 text-zinc-800'
  
  if (badgeType === 'ACT' || badgeType === 'BUY' || badgeType === 'LONG') {
    styles = 'bg-[#c8e6c9] text-[#2e7d32]'
  } else if (badgeType === 'WATCH' || badgeType === 'HOLD') {
    styles = 'bg-[#ffe0b2] text-[#e65100]'
  } else if (badgeType === 'NOISE' || badgeType === 'SHORT') {
    styles = 'bg-zinc-200 text-zinc-700'
  } else if (badgeType === 'AVOID') {
    styles = 'bg-[#ffcdd2] text-[#c62828]'
  }
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold font-display border-2 border-bg-darker shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] uppercase tracking-wider ${styles} ${className}`}>
      {children || type}
    </span>
  )
}

export default PillBadge
