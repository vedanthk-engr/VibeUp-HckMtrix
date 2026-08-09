import React, { useEffect, useRef, useState } from 'react'
import { X, PhoneOff, Mic, Volume2, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVoice } from '../../hooks/useVoice'
import { useVibeStore } from '../../store/vibeStore'
import { api } from '../../lib/api'

export function VoiceCallModal({ isOpen, onClose }) {
  const { riskArchetype, vibeSelections, holdings, language, voiceStyle } = useVibeStore()
  const [callState, setCallState] = useState('connecting') // connecting | listening | thinking | speaking
  const [lastSpeechText, setLastSpeechText] = useState('')
  const [aiResponseText, setAiResponseText] = useState('')
  
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  // Map holdings to simple summary string for system prompt context
  const holdingsSummary = holdings.map(h => `${h.ticker} (${h.quantity} shares)`).join(', ') || 'No holdings yet'

  // Voice engine hook
  const { 
    startListening, 
    stopListening, 
    speak, 
    cancelSpeech, 
    isListening, 
    isPlaying 
  } = useVoice({
    language,
    voiceStyle,
    onResult: async (text) => {
      if (!text.trim()) return
      setLastSpeechText(text)
      handleUserSpeech(text)
    }
  })

  // Start the call conversation flow
  useEffect(() => {
    if (isOpen) {
      setCallState('connecting')
      setLastSpeechText('')
      setAiResponseText('')
      
      const timer = setTimeout(() => {
        setCallState('listening')
        startListening()
      }, 1500)

      return () => {
        clearTimeout(timer)
        cancelSpeech()
        stopListening()
      }
    }
  }, [isOpen])

  // Sync state machine with speech playing status
  useEffect(() => {
    if (callState === 'speaking' && !isPlaying) {
      // AI finished speaking, start listening again
      setCallState('listening')
      startListening()
    }
  }, [isPlaying, callState])

  // Render canvas sine wave animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let phase = 0

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Determine wave params based on call state
      let numWaves = 3
      let amplitude = 0
      let frequency = 0.02
      let speed = 0.08

      if (callState === 'listening') {
        amplitude = 15 // small amplitude showing listening
        speed = 0.1
        frequency = 0.03
      } else if (callState === 'thinking') {
        amplitude = 4 // very flat thinking wave
        speed = 0.05
        frequency = 0.015
      } else if (callState === 'speaking') {
        amplitude = 35 // large speaking wave
        speed = 0.15
        frequency = 0.04
      } else {
        amplitude = 8
      }

      ctx.lineWidth = 3
      ctx.strokeStyle = '#000'

      for (let i = 0; i < numWaves; i++) {
        ctx.beginPath()
        const currentAmp = amplitude * (1 - i * 0.3)
        const currentFreq = frequency * (1 + i * 0.2)
        ctx.strokeStyle = i === 0 ? '#7c3aed' : i === 1 ? '#fd56a7' : '#00d09c'
        ctx.globalAlpha = i === 0 ? 1.0 : i === 1 ? 0.6 : 0.3

        for (let x = 0; x < canvas.width; x++) {
          const y = canvas.height / 2 + Math.sin(x * currentFreq + phase + i * 5) * currentAmp
          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
      }

      phase += speed
      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [callState])

  const handleDoneSpeaking = () => {
    stopListening()
    const activeText = transcript || lastSpeechText
    const textToSend = activeText && activeText.trim() ? activeText : "What is the market telemetry and portfolio outlook today?"
    setLastSpeechText(textToSend)
    handleUserSpeech(textToSend)
  }

  const handleUserSpeech = async (text) => {
    stopListening()
    setCallState('thinking')
    
    try {
      // Build context
      const userCtx = {
        risk_archetype: riskArchetype,
        vibe_selections: vibeSelections.join(', '),
        portfolio_summary: holdingsSummary
      }

      // Query standard chat endpoint to get AI response
      let rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
        rawUrl = 'https://' + rawUrl
      }
      const apiBaseUrl = rawUrl.replace(/\/$/, '')
      
      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          user_context: userCtx
        })
      })

      if (!response.body) {
        throw new Error('Streaming body not supported')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim()
            if (dataStr === '[DONE]') break
            try {
              const dataObj = JSON.parse(dataStr)
              if (dataObj.text) {
                fullText += dataObj.text
              }
            } catch (err) {}
          }
        }
      }

      if (!fullText.trim()) {
        fullText = "I couldn't hear that clearly, my friend. Let's try again."
      }

      // Clean response of specific text markers like DYOR
      const voiceText = fullText.replace(/DYOR/g, '').trim()

      setAiResponseText(fullText)
      setCallState('speaking')
      speak(voiceText)

    } catch (err) {
      console.error('Error during voice conversation endpoint query:', err)
      setCallState('speaking')
      speak("Yo, I encountered a connection glitch. Let's try that again.")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <motion.div 
        initial={{ scale: 0.9, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 50, opacity: 0 }}
        className="w-full max-w-md bg-[#15151a] border-4 border-black rounded-[36px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col h-[600px] text-white p-6 relative"
      >
        {/* Header */}
        <div className="flex justify-between items-center w-full shrink-0">
          <span className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">Aurex AI Live Voice</span>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-full border-2 border-black bg-white hover:bg-zinc-150 text-black flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none"
          >
            <X size={14} className="stroke-[3]" />
          </button>
        </div>

        {/* Profile/Avatar Indicator */}
        <div className="flex-1 flex flex-col justify-center items-center py-6">
          <div className="relative">
            <motion.div 
              animate={{ 
                scale: callState === 'listening' ? [1, 1.15, 1] : callState === 'speaking' ? [1, 1.25, 1] : 1
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`h-24 w-24 rounded-full border-4 border-black flex items-center justify-center text-4xl shadow-[4px_4px_0px_#000] 
                ${callState === 'listening' ? 'bg-[#00d09c]' : callState === 'speaking' ? 'bg-[#7c3aed]' : callState === 'thinking' ? 'bg-[#fde047] animate-pulse' : 'bg-zinc-800'}
              `}
            >
              🎙️
            </motion.div>
            {callState === 'speaking' && (
              <span className="absolute -bottom-2 -right-2 bg-white text-black p-1.5 border-2 border-black rounded-full shadow-[2px_2px_0px_#000]">
                <Volume2 size={14} className="animate-bounce" />
              </span>
            )}
            {callState === 'thinking' && (
              <span className="absolute -bottom-2 -right-2 bg-white text-black p-1.5 border-2 border-black rounded-full shadow-[2px_2px_0px_#000]">
                <Loader2 size={14} className="animate-spin" />
              </span>
            )}
          </div>

          <h2 className="text-xl font-black font-display uppercase tracking-tight mt-6">Aurex Co-Pilot</h2>
          
          {/* Active status bubble */}
          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 border-2 border-black rounded-lg mt-2 text-black shadow-[2px_2px_0px_#000]
            ${callState === 'connecting' && 'bg-zinc-400'}
            ${callState === 'listening' && 'bg-[#00d09c] animate-pulse'}
            ${callState === 'thinking' && 'bg-[#fde047]'}
            ${callState === 'speaking' && 'bg-[#7c3aed] text-white'}
          `}>
            {callState}
          </span>

          {/* Transcript boxes */}
          <div className="w-full mt-8 max-w-xs space-y-3 font-sans text-xs">
            {(transcript || lastSpeechText) && (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3.5 text-left text-zinc-300">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block mb-1">You Said:</span>
                <p className="font-semibold line-clamp-2">{transcript || lastSpeechText}</p>
              </div>
            )}

            {aiResponseText && callState === 'speaking' && (
              <div className="bg-[#7c3aed]/10 border border-[#7c3aed]/30 rounded-2xl p-3.5 text-left text-violet-300">
                <span className="text-[8px] font-black text-[#a78bfa] uppercase tracking-wider block mb-1">Aurex AI:</span>
                <p className="font-semibold line-clamp-3 leading-relaxed">{aiResponseText}</p>
              </div>
            )}
          </div>
        </div>

        {/* Waves visualization area */}
        <div className="w-full h-24 bg-zinc-950 border-3 border-black rounded-2xl overflow-hidden relative shrink-0 shadow-[4px_4px_0px_#000] mb-8">
          <canvas ref={canvasRef} width={380} height={96} className="w-full h-full" />
        </div>

        {/* End Call & Control Footer */}
        <div className="w-full shrink-0 flex flex-col items-center gap-3 pb-2">
          {/* Action Control Buttons */}
          <div className="flex items-center justify-center gap-3 w-full">
            {callState === 'listening' ? (
              <button 
                type="button"
                onClick={handleDoneSpeaking}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-3 border-black bg-emerald-400 hover:bg-emerald-500 text-black rounded-2xl font-black text-xs uppercase tracking-wider cursor-pointer shadow-[3px_3px_0px_#000] active:translate-y-0.5 active:shadow-none transition-all animate-pulse"
              >
                <Mic size={14} className="stroke-[3]" />
                <span>⏹️ DONE SPEAKING (SEND)</span>
              </button>
            ) : callState === 'speaking' ? (
              <button 
                type="button"
                onClick={() => {
                  cancelSpeech()
                  setCallState('ready')
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-3 border-black bg-amber-400 hover:bg-amber-500 text-black rounded-2xl font-black text-xs uppercase tracking-wider cursor-pointer shadow-[3px_3px_0px_#000] active:translate-y-0.5 active:shadow-none transition-all"
              >
                <Volume2 size={14} />
                <span>⏹️ MUTE AUDIO</span>
              </button>
            ) : callState === 'thinking' ? (
              <div className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-3 border-black bg-purple-900/80 text-purple-200 rounded-2xl font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#000]">
                <Loader2 size={14} className="animate-spin text-purple-300" />
                <span>REASONING & SYNTHESIZING...</span>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => {
                  setCallState('listening')
                  startListening()
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-3 border-black bg-purple-500 hover:bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider cursor-pointer shadow-[3px_3px_0px_#000] active:translate-y-0.5 active:shadow-none transition-all"
              >
                <Mic size={14} />
                <span>🎙️ START SPEAKING</span>
              </button>
            )}

            <button 
              type="button"
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 px-4 py-3 border-3 border-black bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider cursor-pointer shadow-[3px_3px_0px_#000] active:translate-y-0.5 active:shadow-none transition-all shrink-0"
            >
              <PhoneOff size={14} />
              <span>END CALL</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default VoiceCallModal
