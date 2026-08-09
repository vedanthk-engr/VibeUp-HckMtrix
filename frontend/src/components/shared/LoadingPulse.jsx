import React from 'react'

export function LoadingPulse({ className = '', variant = 'card' }) {
  if (variant === 'text') {
    return (
      <div className={`h-4 bg-white/5 rounded animate-pulse w-3/4 relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite]" />
      </div>
    )
  }
  
  if (variant === 'circle') {
    return (
      <div className={`rounded-full bg-white/5 animate-pulse relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite]" />
      </div>
    )
  }

  return (
    <div className={`glass-panel border-white/5 rounded-2xl p-6 h-36 flex flex-col justify-between animate-pulse relative overflow-hidden ${className}`}>
      {/* Shimmer sweep */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite]" />
      <div className="flex justify-between items-center">
        <div className="h-6 w-24 bg-white/10 rounded" />
        <div className="h-6 w-12 bg-white/10 rounded-full" />
      </div>
      <div className="space-y-2 mt-4">
        <div className="h-4 bg-white/10 rounded w-full" />
        <div className="h-4 bg-white/10 rounded w-5/6" />
      </div>
    </div>
  )
}

export default LoadingPulse
