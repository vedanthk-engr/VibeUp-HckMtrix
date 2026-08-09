import React, { useEffect, useState, useRef } from 'react'
import { Mic, MicOff, X, Volume2, Square, Play, Loader2, Sparkles } from 'lucide-react'

export function VoiceButton({ 
  isListening, 
  startListening, 
  stopListening, 
  activeTranscript, 
  isSpeaking, 
  speakText, 
  cancelSpeech, 
  isLoading 
}) {
  const [showOverlay, setShowOverlay] = useState(false)
  const [bars, setBars] = useState(Array(15).fill(4))
  const animationRef = useRef(null)

  const handleOpenVoice = (e) => {
    e.stopPropagation()
    setShowOverlay(true)
    startListening()
  }

  const handleCloseVoice = () => {
    stopListening()
    if (cancelSpeech) cancelSpeech()
    setShowOverlay(false)
  }

  // Handle CSS volume bar animation when listening or speaking
  useEffect(() => {
    if ((isListening || isSpeaking || isLoading) && showOverlay) {
      const animateWave = () => {
        setBars(prev => prev.map(() => Math.floor(Math.random() * 24) + 6))
        animationRef.current = setTimeout(animateWave, 100)
      }
      animateWave()
    } else {
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
      setBars(Array(15).fill(4))
    }
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current)
    }
  }, [isListening, isSpeaking, isLoading, showOverlay])

  return (
    <div>
      {/* Floating mic activation button */}
      <button
        type="button"
        onClick={handleOpenVoice}
        className="
          flex items-center justify-center h-11 w-11 rounded-xl bg-rainbow-3 text-black border-3 border-black shadow-[3px_3px_0px_0px_#1c1b1b] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1c1b1b] active:translate-y-1 active:shadow-[0px_0px_0px_0px_#1c1b1b] transition-all cursor-pointer
        "
        title="Start Gemma 4 Voice Call"
      >
        <Mic size={18} className="stroke-[3]" />
      </button>

      {/* Full-screen Voice Overlay */}
      {showOverlay && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between p-8 bg-[#fcf9f8]/95 backdrop-blur-md animate-in fade-in duration-300 border-4 border-black select-none">
          {/* Header decorators */}
          <div className="w-full flex justify-between items-center">
            <div className="flex gap-2 transform -rotate-2">
              <span className="text-xs bg-rainbow-5 px-3 py-1.5 border-2 border-black rounded-lg font-black uppercase shadow-[2px_2px_0px_0px_#1c1b1b] flex items-center gap-1.5">
                <Sparkles size={14} className="text-purple-700 animate-spin" />
                <span>GEMMA 4 VOICE LINK ⚡</span>
              </span>
            </div>
            
            {/* Close button */}
            <button 
              type="button"
              onClick={handleCloseVoice}
              className="p-2 w-11 h-11 rounded-full border-3 border-black bg-white text-black flex items-center justify-center shadow-[3px_3px_0px_0px_#1c1b1b] hover:bg-rainbow-1 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} className="stroke-[3]" />
            </button>
          </div>

          {/* Core Waveform & Transcript */}
          <div className="flex flex-col items-center justify-center flex-1 w-full max-w-md gap-6">
            {/* Mascot Listening, Thinking or Speaking */}
            <div className={`w-40 h-40 rounded-full border-4 border-black ${
              isSpeaking ? 'bg-rainbow-3 animate-pulse' : isLoading ? 'bg-rainbow-5 animate-spin' : isListening ? 'bg-rainbow-4 animate-bounce' : 'bg-white'
            } overflow-hidden shadow-[6px_6px_0px_0px_#1c1b1b] transform rotate-3 flex items-center justify-center font-display text-5xl`}>
              {isSpeaking ? '🤖' : isLoading ? '⚡' : isListening ? '👂' : '🎙️'}
            </div>

            {/* Status Indicator */}
            <h2 className="text-lg font-extrabold font-display text-black uppercase tracking-tight transform -rotate-1 bg-rainbow-4 px-4 py-2 border-3 border-black shadow-[4px_4px_0px_0px_#1c1b1b] flex items-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-purple-800" />
                  <span>GEMMA 4 REASONING & ANALYZING...</span>
                </>
              ) : isSpeaking ? (
                <>
                  <Volume2 size={18} className="animate-pulse text-pink-700" />
                  <span>GEMMA 4 IS SPEAKING...</span>
                </>
              ) : isListening ? (
                <>
                  <Mic size={18} className="animate-bounce text-emerald-800" />
                  <span>CO-PILOT IS LISTENING...</span>
                </>
              ) : (
                <>
                  <MicOff size={18} className="text-zinc-600" />
                  <span>READY TO TALK</span>
                </>
              )}
            </h2>

            {/* Visualizer Wave */}
            <div className="flex items-end justify-center gap-1.5 h-24 w-full max-w-xs bg-white p-4 rounded-3xl border-3 border-black shadow-[4px_4px_0px_0px_#1c1b1b]">
              {bars.map((height, i) => {
                const colors = ['#630ed4', '#b4136d', '#fd56a7', '#ffb690', '#fde047']
                return (
                  <div
                    key={i}
                    className="w-2.5 rounded-full border-2 border-black transition-all duration-100"
                    style={{ 
                      height: `${height * 3}%`,
                      backgroundColor: colors[i % colors.length],
                      opacity: (isListening || isSpeaking || isLoading) ? 1 : 0.3
                    }}
                  />
                )
              })}
            </div>

            {/* Live Transcript Box */}
            <div className="w-full bg-white p-4 rounded-2xl border-3 border-black shadow-[4px_4px_0px_0px_#1c1b1b] max-h-32 overflow-y-auto text-center">
              <p className="text-sm font-bold text-black leading-relaxed font-sans">
                {isSpeaking 
                  ? speakText 
                  : isLoading 
                    ? 'Synthesizing market telemetry & multi-agent consensus...' 
                    : activeTranscript || 'Click "Start Speaking" below and ask your financial query...'}
              </p>
            </div>

            {/* Manual Action Buttons (Speak / Stop Speaking / Mute) */}
            <div className="flex items-center gap-4 mt-2">
              {isListening ? (
                <button
                  type="button"
                  onClick={() => stopListening()}
                  className="px-6 py-3 rounded-2xl bg-red-400 text-black font-black font-display text-sm uppercase border-3 border-black shadow-[4px_4px_0px_0px_#1c1b1b] hover:bg-red-500 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 cursor-pointer animate-pulse"
                >
                  <Square size={16} className="fill-black" />
                  <span>⏹️ DONE SPEAKING (SEND)</span>
                </button>
              ) : isSpeaking ? (
                <button
                  type="button"
                  onClick={() => cancelSpeech && cancelSpeech()}
                  className="px-6 py-3 rounded-2xl bg-amber-300 text-black font-black font-display text-sm uppercase border-3 border-black shadow-[4px_4px_0px_0px_#1c1b1b] hover:bg-amber-400 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Square size={16} className="fill-black" />
                  <span>⏹️ STOP AUDIO</span>
                </button>
              ) : isLoading ? (
                <div className="px-6 py-3 rounded-2xl bg-purple-200 text-black font-black font-display text-sm uppercase border-3 border-black shadow-[4px_4px_0px_0px_#1c1b1b] flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-purple-800" />
                  <span>ANALYZING QUERY...</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startListening()}
                  className="px-6 py-3 rounded-2xl bg-emerald-400 text-black font-black font-display text-sm uppercase border-3 border-black shadow-[4px_4px_0px_0px_#1c1b1b] hover:bg-emerald-500 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Mic size={16} className="stroke-[3]" />
                  <span>🎙️ START SPEAKING</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom guidelines */}
          <div className="text-center text-[10px] text-zinc-500 font-bold font-display uppercase tracking-widest bg-white border-2 border-black rounded px-3 py-1 shadow-[2px_2px_0px_0px_#1c1b1b]">
            Powered by Gemma 4 • English / Hindi / Tamil / Telugu
          </div>

        </div>
      )}
    </div>
  )
}

export default VoiceButton

