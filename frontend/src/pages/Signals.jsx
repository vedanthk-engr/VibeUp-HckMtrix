import React from 'react'
import { motion } from 'framer-motion'
import { SignalFeed } from '../components/Signals/SignalFeed'
import { Zap } from 'lucide-react'

export function Signals() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto px-4 pt-6 pb-32 text-left"
    >
      {/* Header Section */}
      <div className="mb-10 mt-6 relative select-none">
        <h1 className="font-display text-5xl md:text-[80px] leading-none text-[#1c1b1b] uppercase tracking-tighter flex items-center gap-2 drop-shadow-[3px_3px_0px_#7dd3fc]">
          Signal Feed 
          <Zap size={48} className="text-[#fd56a7] fill-[#fd56a7] shrink-0" />
        </h1>
        <p className="font-sans text-xs font-bold text-zinc-600 bg-white px-4 py-2 border-2 border-black rounded-lg inline-block transform rotate-1 mt-4 shadow-[2px_2px_0px_#1c1b1b]">
          Live volume anomalies, SEBI filings, and news channels scanned in real-time.
        </p>
      </div>

      {/* Feed list */}
      <SignalFeed />
    </motion.div>
  )
}

export default Signals

