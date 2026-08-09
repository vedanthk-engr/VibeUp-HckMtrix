import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ChatWindow } from '../components/Chat/ChatWindow'
import { VoiceCallModal } from '../components/Chat/VoiceCallModal'
import { MessageSquare, Flame, PhoneCall } from 'lucide-react'

export function Chat() {
  const [voiceCallOpen, setVoiceCallOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto px-4 pt-4 pb-32 text-left relative"
    >
      {/* Background Sweeping Doodles */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
        {/* Sparkle Doodle */}
        <svg className="absolute top-[12%] right-[8%] w-10 h-10 opacity-30 text-rainbow-3 animate-pulse-star" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      </div>

      {/* Header Section */}
      <div className="flex items-center justify-between mb-8 transform -rotate-1 relative z-10 mt-2">
        <div>
          <span className="text-[10px] text-rainbow-2 font-bold uppercase tracking-widest font-display flex items-center gap-1.5 mb-1">
            <MessageSquare size={12} className="fill-rainbow-2" />
            <span>CO-PILOT DIALOGUE</span>
          </span>
          <h1 className="text-4xl font-extrabold font-display text-bg-darker tracking-tight uppercase">Ask Co-pilot</h1>
          <p className="text-zinc-500 text-xs mt-1 max-w-md">
            Your personal Gen Z financial bestie. Analyze holdings, filings, or ask for general market telemetry.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 transform rotate-2">
          <button
            onClick={() => setVoiceCallOpen(true)}
            className="flex items-center gap-1.5 bg-[#7c3aed] text-white px-4 py-2 border-3 border-black rounded-full shadow-[3px_3px_0px_0px_#1c1b1b] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer font-display text-[10px] font-black uppercase tracking-wider"
          >
            <PhoneCall size={12} className="stroke-[3]" />
            <span>Voice Call</span>
          </button>

          <div className="flex items-center gap-2 bg-white px-4 py-2 border-3 border-black rounded-full shadow-[3px_3px_0px_0px_#1c1b1b]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] border-2 border-black animate-pulse" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-black">online</span>
          </div>
        </div>
      </div>

      <ChatWindow />

      <VoiceCallModal isOpen={voiceCallOpen} onClose={() => setVoiceCallOpen(false)} />
    </motion.div>
  )
}

export default Chat

