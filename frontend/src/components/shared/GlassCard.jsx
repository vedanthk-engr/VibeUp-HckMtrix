import React from 'react'

export function GlassCard({ children, className = '', hover = false, onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white 
        border-3 
        border-bg-darker 
        rounded-2xl 
        shadow-[6px_6px_0px_0px_#1c1b1b] 
        relative 
        overflow-hidden 
        transition-all 
        duration-200
        ${hover ? 'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#1c1b1b] cursor-pointer' : ''} 
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

export default GlassCard
