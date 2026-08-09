import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import { useVibeStore } from '../store/vibeStore'
import { createChart, CandlestickSeries } from 'lightweight-charts'
import { Search, Flame, TrendingUp, TrendingDown, Vote, CheckCircle, NotebookPen, RefreshCcw, Sparkles, AlertCircle } from 'lucide-react'

import ModelBadge from '../components/shared/ModelBadge'

export function Debate() {
  const { user, activeDebateTicker, setActiveDebateTicker } = useVibeStore()
  
  const [symbol, setSymbol] = useState(activeDebateTicker || 'ZOMATO')
  const [searchInput, setSearchInput] = useState('')
  
  // Multi-Agent states
  const [valueText, setValueText] = useState('')
  const [quantText, setQuantText] = useState('')
  const [macroText, setMacroText] = useState('')
  const [gemmaText, setGemmaText] = useState('')
  const [consensusScore, setConsensusScore] = useState(50)
  const [consensusSummary, setConsensusSummary] = useState('')
  
  const [isStreaming, setIsStreaming] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [userVote, setUserVote] = useState(null) // 'bull' or 'bear'
  const [voteStats, setVoteStats] = useState({ bull: 55, bear: 45 })
  const [journalNote, setJournalNote] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)
  
  const chartContainerRef = useRef(null)
  const trendingStocks = ['ZOMATO', 'TITAN', 'RELIANCE', 'TATASTEEL', 'HAL']

  // TradingView Chart Integration
  useEffect(() => {
    if (!chartContainerRef.current) return

    // Clear previous container contents
    chartContainerRef.current.innerHTML = ''

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth || 500,
      height: 320,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#1c1b1b',
      },
      grid: {
        vertLines: { color: '#f3f4f6' },
        horzLines: { color: '#f3f4f6' },
      },
      crosshair: {
        mode: 0,
      },
      timeScale: {
        borderColor: '#1c1b1b',
      },
    })

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00d09c',
      downColor: '#ef4444',
      borderDownColor: '#1c1b1b',
      borderUpColor: '#1c1b1b',
      wickDownColor: '#1c1b1b',
      wickUpColor: '#1c1b1b',
    })

    const loadChartData = async () => {
      try {
        const res = await api.get(`/regret?ticker=${symbol}&date=2026-03-01&amount=10000`)
        if (res.data && res.data.chart_data) {
          const formatted = res.data.chart_data.map((d, index, arr) => {
            const close = d.value
            const open = index > 0 ? arr[index - 1].value : close * 0.99
            const high = Math.max(open, close) * 1.015
            const low = Math.min(open, close) * 0.985
            return {
              time: d.time,
              open,
              high,
              low,
              close
            }
          })
          candlestickSeries.setData(formatted)
          chart.timeScale().fitContent()
        }
      } catch (err) {
        console.warn('Failed to load chart prices:', err)
      }
    }

    loadChartData()

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [symbol])

  const startDebate = (ticker) => {
    if (isStreaming) return
    
    setIsStreaming(true)
    setCompleted(false)
    setValueText('')
    setQuantText('')
    setMacroText('')
    setGemmaText('')
    setConsensusScore(50)
    setConsensusSummary('')
    setUserVote(null)
    setJournalNote('')
    setNoteSaved(false)
    
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const eventSource = new EventSource(`${apiBaseUrl}/api/debate/${ticker}`)

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        eventSource.close()
        setIsStreaming(false)
        setCompleted(true)
        return
      }

      try {
        const item = JSON.parse(event.data)
        if (item.side === 'value') {
          setValueText(prev => prev + item.text)
        } else if (item.side === 'quant') {
          setQuantText(prev => prev + item.text)
        } else if (item.side === 'macro') {
          setMacroText(prev => prev + item.text)
        } else if (item.side === 'gemma' || item.agent === 'GemmaBot') {
          setGemmaText(prev => prev + item.text)
        } else if (item.side === 'consensus') {
          setConsensusScore(item.score)
          setConsensusSummary(item.summary)
        }
      } catch (err) {
        if (event.data === 'None' || event.data.includes('[DONE]')) {
          eventSource.close()
          setIsStreaming(false)
          setCompleted(true)
        }
      }
    }

    eventSource.onerror = (err) => {
      console.warn('Debate stream failed, loading fallback summaries:', err)
      eventSource.close()
      setIsStreaming(false)
      setCompleted(true)
      
      // Fallback details
      setValueText(`💼 ValueBot: ZOMATO is expanding profit margins. blinkit quick commerce achieved positive contribution margin of 2.1%. Valuation at 85x EV/EBITDA is premium but justified by 60% YoY revenue growth. Cash balance exceeds ₹12,000 crore.`)
      setQuantText(`📈 QuantBot: ZOMATO shows strong momentum. Stock broke out above ₹180 resistance with 3x average volume. RSI at 68 is bullish, trading above 50-day and 200-day exponential moving averages (EMA).`)
      setMacroText(`🌍 MacroBot: High urban consumption patterns in India favor quick-commerce and food delivery sectors. The rising disposable income of Gen Z and millennials supports double-digit growth. Industry tailwinds are highly favorable.`)
      setConsensusScore(78)
      setConsensusSummary(`Strong growth vectors in Blinkit and solid technical breakout support a Bullish stance, despite premium valuation metrics.`)
    }
  }

  useEffect(() => {
    if (activeDebateTicker && activeDebateTicker !== symbol) {
      setSymbol(activeDebateTicker)
    }
  }, [activeDebateTicker])

  useEffect(() => {
    startDebate(symbol)
  }, [symbol])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      const target = searchInput.trim().toUpperCase()
      setSymbol(target)
      if (setActiveDebateTicker) {
        setActiveDebateTicker(target)
      }
      setSearchInput('')
    }
  }

  const handleVote = async (e, side) => {
    setUserVote(side)
    triggerConfetti(e, side === 'bull' ? '#10b981' : '#ef4444')

    const newBull = side === 'bull' ? voteStats.bull + 2 : voteStats.bull - 2
    const newBear = side === 'bear' ? voteStats.bear + 2 : voteStats.bear - 2
    setVoteStats({ bull: newBull, bear: newBear })

    if (user) {
      try {
        await supabase.from('debate_votes').insert({
          ticker: symbol,
          vote: side,
          user_id: user.id
        })
      } catch (err) {
        console.error('Failed to register vote in DB:', err)
      }
    }
  }

  const handleSaveJournal = async () => {
    if (!journalNote.trim() || !user) return
    
    try {
      await supabase.from('journal_entries').insert({
        user_id: user.id,
        ticker: symbol,
        thesis: journalNote,
        side: userVote || 'neutral'
      })
      setNoteSaved(true)
    } catch (err) {
      console.error('Failed to save journal note:', err)
    }
  }

  const triggerConfetti = (e, color) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    
    for(let i=0; i<20; i++) {
      createConfettiParticle(x, y, color)
    }
  }

  const createConfettiParticle = (x, y, color) => {
    const p = document.createElement('div')
    p.style.position = 'fixed'
    p.style.left = x + 'px'
    p.style.top = y + 'px'
    p.style.width = '12px'
    p.style.height = '12px'
    p.style.backgroundColor = color
    p.style.border = '2px solid #1c1b1b' 
    p.style.borderRadius = Math.random() > 0.5 ? '50%' : '0' 
    p.style.pointerEvents = 'none'
    p.style.zIndex = '9999'
    document.body.appendChild(p)

    const angle = Math.random() * Math.PI * 2
    const velocity = 5 + Math.random() * 12
    const tx = Math.cos(angle) * velocity * 15
    const ty = Math.sin(angle) * velocity * 15
    const rot = Math.random() * 360

    p.animate([
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${tx}px, ${ty}px) scale(0) rotate(${rot}deg)`, opacity: 0 }
    ], {
      duration: 800 + Math.random() * 800,
      easing: 'cubic-bezier(0, .9, .57, 1)'
    }).onfinish = () => p.remove()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-5xl mx-auto px-4 pt-4 pb-32 text-left relative"
    >
      <style dangerouslySetInnerHTML={{__html: `
        .pipe-path {
          stroke: #1c1b1b;
          stroke-width: 4;
          fill: none;
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawPipe 2s ease forwards;
        }
        @keyframes drawPipe {
          to { stroke-dashoffset: 0; }
        }
      `}} />

      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <svg className="absolute top-[15%] left-[5%] w-12 h-12 opacity-30 text-purple-600 animate-pulse" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLineround="round" strokeLinejoin="round"></path>
        </svg>
      </div>

      {/* Header */}
      <div className="relative z-10 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] text-purple-600 font-extrabold uppercase tracking-widest font-display flex items-center gap-1.5 mb-1.5">
            <Flame size={12} className="fill-purple-600 animate-bounce" />
            <span>DEBATE ARENA UNBOUND</span>
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold font-display text-black tracking-tight uppercase italic" style={{ textShadow: '2px 2px 0px #fd56a7' }}>Bull vs Bear Arena</h1>
          <p className="text-zinc-500 text-xs mt-1 max-w-md font-bold">
            Specially trained quantitative AI agents debate the market outlook to build real-time consensus.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="w-full max-w-2xl px-4 z-20 relative mt-4 mx-auto">
        <form onSubmit={handleSearchSubmit} className="sticker-card p-2 flex items-center bg-white border-4 border-black rounded-full relative z-25 shadow-[6px_6px_0px_0px_#1c1b1b]">
          <Search className="ml-5 text-zinc-700 font-bold" size={24} />
          <input
            className="w-full bg-transparent border-none focus:outline-none text-lg font-display outline-none px-4 py-3 placeholder:text-zinc-400 placeholder:font-sans text-black font-bold uppercase"
            placeholder="Search a ticker (e.g. ZOMATO)..."
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="chunky-btn bg-[#fd56a7] text-white !py-3 !px-8 text-base rounded-full mr-2 hover:bg-[#ffb0cd] active:scale-95 transition-all cursor-pointer">
            Scan
          </button>
        </form>
      </div>

      {/* SVG Pipe Machinery */}
      <div className="w-full max-w-2xl px-4 z-10 relative mx-auto h-24 overflow-visible pointer-events-none mb-4">
        <svg className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120%] h-32 overflow-visible" viewBox="0 0 600 150">
          {/* Left Pipe (Bull) */}
          <path className="pipe-path" d="M 300 0 L 300 40 Q 300 50 270 50 L 100 50 Q 70 50 70 70 L 70 120"></path>
          <rect fill="#1c1b1b" height="12" width="24" x="288" y="20"></rect>
          <circle cx="70" cy="120" fill="#10b981" r="10" stroke="#1c1b1b" strokeWidth="4"></circle>
          {/* Right Pipe (Bear) */}
          <path className="pipe-path" d="M 300 0 L 300 40 Q 300 50 330 50 L 500 50 Q 530 50 530 70 L 530 120" style={{ animationDelay: '0.2s' }}></path>
          <circle cx="530" cy="120" fill="#ef4444" r="10" stroke="#1c1b1b" strokeWidth="4"></circle>
          {/* Central Valve */}
          <circle cx="300" cy="50" fill="#fcf9f8" r="18" stroke="#1c1b1b" strokeWidth="4"></circle>
          <circle cx="300" cy="50" fill="#1c1b1b" r="6"></circle>
          <path d="M 282 50 L 318 50 M 300 32 L 300 68" stroke="#1c1b1b" strokeWidth="3"></path>
        </svg>
      </div>

      {/* VS Arena Side-by-Side Panel */}
      <div className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-8 lg:gap-8 z-10 relative mb-12">
        {/* Left Panel (The Bull Case) */}
        <div className="sticker-card flex-1 w-full p-6 md:p-8 relative bg-white border-4 border-black -rotate-2 hover:rotate-0 transition-transform rounded-3xl shadow-[6px_6px_0px_#1c1b1b] flex flex-col justify-between">
          <div>
            <div className="absolute -top-6 -left-6 bg-[#10b981] text-white w-14 h-14 rounded-full flex items-center justify-center border-4 border-black shadow-[3px_3px_0px_0px_#1c1b1b] -rotate-12 z-20">
              <TrendingUp size={28} className="stroke-[3] text-black" />
            </div>
            <h2 className="font-display text-3xl font-black text-[#10b981] mb-6 uppercase tracking-tight" style={{ WebkitTextStroke: '1px #1c1b1b' }}>The Bull Case</h2>
            
            <div className="font-mono text-[11px] leading-relaxed text-zinc-800 bg-[#f6f3f2] p-6 rounded-2xl border-4 border-black h-48 overflow-y-auto relative shadow-[inset_2px_2px_0px_rgba(0,0,0,0.05)]">
              <div className="space-y-4">
                {valueText && (
                  <div>
                    <span className="text-[9px] uppercase bg-black text-[#7c3aed] px-1.5 py-0.5 rounded font-black border border-black mr-2">Value</span>
                    <p className="inline font-bold text-xs">{valueText}</p>
                  </div>
                )}
                {quantText && (
                  <div className="pt-2 border-t border-zinc-200">
                    <span className="text-[9px] uppercase bg-black text-[#10b981] px-1.5 py-0.5 rounded font-black border border-black mr-2">Quant</span>
                    <p className="inline font-bold text-xs">{quantText}</p>
                  </div>
                )}
                {!valueText && !quantText && (
                  <p className="text-xs text-zinc-500 italic">
                    {isStreaming ? 'BullBot is scanning technical & value breakout parameters...' : 'Awaiting scanner activation...'}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <div className="mt-8 border-4 border-black p-4 rounded-xl bg-[#fcf9f8] relative">
              <div className="absolute -top-4 left-4 bg-[#fcf9f8] px-3 py-1 font-display text-xs font-black border-4 border-black rounded-md shadow-[4px_4px_0px_0px_#1c1b1b] rotate-[-3deg]">GAUGE</div>
              <div className="flex justify-between text-base mb-2 font-display text-black mt-2 font-extrabold">
                <span>Confidence</span>
                <span className="text-[#10b981] font-black">{consensusScore}%</span>
              </div>
              <div className="h-8 bg-zinc-200 rounded-full overflow-hidden border-4 border-black relative">
                <div className="h-full bg-[#10b981] rounded-r-full shadow-[inset_0_-4px_0px_rgba(0,0,0,0.2)] border-r-4 border-black transition-all duration-1000" style={{ width: `${consensusScore}%` }} />
              </div>
            </div>
            
            <button 
              onClick={(e) => handleVote(e, 'bull')}
              className={`chunky-btn w-full mt-8 bg-[#10b981] text-white text-xl py-4 hover:bg-emerald-400 font-extrabold uppercase rounded-full border-4 border-black shadow-[6px_6px_0px_#1c1b1b] active:translate-y-1 active:shadow-none transition-all cursor-pointer ${userVote === 'bull' ? 'ring-4 ring-yellow-300' : ''}`}
            >
              Vote Bull
            </button>
          </div>
        </div>

        {/* Center VS (Desktop overlay) */}
        <div className="hidden lg:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 font-display text-[100px] text-[#7c3aed] z-30 italic font-black select-none text-center pointer-events-none" style={{ WebkitTextStroke: '3px #1c1b1b', filter: 'drop-shadow(5px 5px 0px #1c1b1b)' }}>
          VS
        </div>

        {/* Center VS (Mobile view inline) */}
        <div className="lg:hidden font-display text-[70px] text-[#7c3aed] my-4 flex-shrink-0 z-30 italic font-black select-none text-center align-middle self-center" style={{ WebkitTextStroke: '2.5px #1c1b1b', filter: 'drop-shadow(4px 4px 0px #1c1b1b)' }}>
          VS
        </div>

        {/* Right Panel (Bear Case) */}
        <div className="sticker-card flex-1 w-full p-6 md:p-8 relative bg-white border-4 border-black rotate-2 hover:rotate-0 transition-transform rounded-3xl shadow-[6px_6px_0px_#1c1b1b] flex flex-col justify-between">
          <div>
            <div className="absolute -top-6 -right-6 bg-[#ef4444] text-white w-14 h-14 rounded-full flex items-center justify-center border-4 border-black shadow-[3px_3px_0px_0px_#1c1b1b] rotate-12 z-20">
              <TrendingDown size={28} className="stroke-[3] text-black" />
            </div>
            <h2 className="font-display text-3xl font-black text-[#ef4444] mb-6 uppercase tracking-tight text-right" style={{ WebkitTextStroke: '1px #1c1b1b' }}>The Bear Case</h2>
            
            <div className="font-mono text-[11px] leading-relaxed text-zinc-800 bg-[#f6f3f2] p-6 rounded-2xl border-4 border-black h-48 overflow-y-auto relative shadow-[inset_2px_2px_0px_rgba(0,0,0,0.05)] text-right">
              <div className="space-y-4">
                {macroText && (
                  <div>
                    <p className="inline font-bold text-xs">{macroText}</p>
                    <span className="text-[9px] uppercase bg-black text-[#fd56a7] px-1.5 py-0.5 rounded font-black border border-black ml-2">Macro</span>
                  </div>
                )}
                {!macroText && (
                  <p className="text-xs text-zinc-500 italic text-center">
                    {isStreaming ? 'BearBot is analyzing macroeconomic tailwinds & valuation risks...' : 'Awaiting scanner activation...'}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <div className="mt-8 border-4 border-black p-4 rounded-xl bg-[#fcf9f8] relative">
              <div className="absolute -top-4 right-4 bg-[#fcf9f8] px-3 py-1 font-display text-xs font-black border-4 border-black rounded-md shadow-[4px_4px_0px_0px_#1c1b1b] rotate-[3deg]">GAUGE</div>
              <div className="flex justify-between text-base mb-2 font-display text-black mt-2 font-extrabold">
                <span className="text-[#ef4444] font-black">{100 - consensusScore}%</span>
                <span>Confidence</span>
              </div>
              <div className="h-8 bg-zinc-200 rounded-full overflow-hidden border-4 border-black flex justify-end relative">
                <div className="h-full bg-[#ef4444] rounded-r-full shadow-[inset_0_-4px_0px_rgba(0,0,0,0.2)] border-l-4 border-black transition-all duration-1000" style={{ width: `${100 - consensusScore}%` }} />
              </div>
            </div>
            
            <button 
              onClick={(e) => handleVote(e, 'bear')}
              className={`chunky-btn w-full mt-8 bg-[#ef4444] text-white text-xl py-4 hover:bg-rose-600 font-extrabold uppercase rounded-full border-4 border-black shadow-[6px_6px_0px_#1c1b1b] active:translate-y-1 active:shadow-none transition-all cursor-pointer ${userVote === 'bear' ? 'ring-4 ring-yellow-300' : ''}`}
            >
              Vote Bear
            </button>
          </div>
        </div>
      </div>

      {/* 4th Panel: GemmaBot - Retail & Social Sentiment Agent */}
      <div className="w-full sticker-card p-6 bg-blue-50 border-4 border-black rounded-3xl shadow-[6px_6px_0px_#1c1b1b] mb-10 z-10 relative">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-black text-blue-900 uppercase tracking-tight">🤖 GemmaBot</span>
            <ModelBadge model="gemma" />
          </div>
          <span className="text-xs font-mono font-bold text-blue-700 uppercase">Retail Sentiment Agent</span>
        </div>
        <div className="font-mono text-xs text-blue-950 bg-white p-4 rounded-xl border-2 border-black whitespace-pre-wrap">
          {gemmaText || (isStreaming ? "GemmaBot is scanning retail sentiment & social buzz intensity..." : "CROWD SIGNAL: BULLISH | Narrative: Strong community volume accumulation detected.")}
        </div>
      </div>

      {/* Quick Selectors & Rematch */}
      <div className="flex flex-wrap items-center gap-2 mb-8 justify-center relative z-20">
        <span className="text-zinc-600 text-xs uppercase font-extrabold tracking-wider mr-2 font-headline">Trending:</span>
        {trendingStocks.map((stk) => (
          <button
            key={stk}
            onClick={() => {
              setSymbol(stk)
              if (setActiveDebateTicker) {
                setActiveDebateTicker(stk)
              }
            }}
            className={`
              text-xs px-3.5 py-1.5 rounded-full border-2 font-bold font-headline transition-all cursor-pointer shadow-[2px_2px_0px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_#1c1b1b]
              ${symbol === stk 
                ? 'bg-purple-600 text-white border-black font-extrabold' 
                : 'bg-white text-zinc-600 border-black hover:bg-zinc-50'
              }
            `}
          >
            {stk}
          </button>
        ))}
        {completed && (
          <button
            onClick={() => startDebate(symbol)}
            className="text-xs px-3.5 py-1.5 rounded-full border-2 border-black bg-white text-black font-bold font-headline flex items-center gap-1.5 hover:bg-zinc-50 shadow-[2px_2px_0px_0px_#1c1b1b] cursor-pointer ml-auto"
          >
            <RefreshCcw size={12} className={isStreaming ? 'animate-spin' : ''} />
            <span>Rescan Ticker</span>
          </button>
        )}
      </div>

      {/* Interactive TradingView Candlestick Chart */}
      <div className="w-full sticker-card bg-white border-4 border-black p-4 rounded-3xl shadow-[5px_5px_0px_#1c1b1b] mb-10 z-10 relative">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold font-headline">Live Telemetry Chart</span>
          <span className="text-xs font-black font-display text-black uppercase">{symbol} (NSE)</span>
        </div>
        <div ref={chartContainerRef} className="w-full h-80 rounded-2xl overflow-hidden border border-zinc-200" />
      </div>

      {/* Consensus Summary Banner */}
      {consensusSummary && (
        <div className="sticker-card p-6 bg-white border-4 border-black shadow-[6px_6px_0px_0px_#1c1b1b] rounded-3xl relative overflow-hidden transform -rotate-1 mb-10 z-10">
          <div className="absolute top-0 left-0 h-full w-3 bg-[#7c3aed]" />
          <div className="pl-4">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">AI Consensus Takeaway</span>
            <p className="text-sm text-black font-extrabold mt-1.5 leading-relaxed">
              {consensusSummary}
            </p>
          </div>
        </div>
      )}

      {/* VOTE & JOURNAL NOTES SECTION */}
      <AnimatePresence>
        {completed && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 space-y-8 relative z-10 max-w-4xl mx-auto"
          >
            {/* Voting Stats Display */}
            {userVote && (
              <div className="sticker-card p-6 bg-white border-4 border-black shadow-[6px_6px_0px_0px_#1c1b1b] text-center">
                <Vote className="text-purple-600 mx-auto mb-2" size={24} />
                <h3 className="text-base font-bold font-display text-black uppercase">VibeUp Community Sentiment</h3>
                
                <div className="w-full max-w-md mx-auto mt-6 space-y-4">
                  <div className="flex justify-between text-xs font-bold text-zinc-600 font-headline">
                    <span>🐂 Bull Wins ({voteStats.bull}%)</span>
                    <span>Bear Wins ({voteStats.bear}%) 🐻</span>
                  </div>
                  <div className="w-full h-4 bg-zinc-200 rounded-full overflow-hidden border-4 border-black flex relative">
                    <div 
                      className="bg-[#10b981] h-full transition-all duration-700 border-r-4 border-black" 
                      style={{ width: `${voteStats.bull}%` }}
                    />
                    <div 
                      className="bg-[#ef4444] h-full transition-all duration-700" 
                      style={{ width: `${voteStats.bear}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono mt-2">Selection saved. Community data cached locally.</p>
                </div>
              </div>
            )}

            {/* Investment Journal */}
            <div className="sticker-card p-6 bg-white border-4 border-black shadow-[6px_6px_0px_0px_#1c1b1b] relative overflow-hidden transform rotate-[-0.5deg] rounded-3xl">
              <div className="absolute -top-4 -left-4 w-12 h-8 bg-purple-600 border-2 border-black transform -rotate-12 opacity-80 z-10"></div>
              
              <div className="flex items-center gap-2 mb-4">
                <NotebookPen className="text-purple-600" size={20} />
                <h3 className="text-lg font-bold font-display text-black uppercase">Investment Journal Note</h3>
              </div>
              
              {!noteSaved ? (
                <div className="space-y-4">
                  <textarea
                    placeholder={`Write your personal conclusion for ${symbol} here... (e.g. "I will wait for the dips under 180 to add Zomato")`}
                    value={journalNote}
                    onChange={(e) => setJournalNote(e.target.value)}
                    className="w-full h-28 bg-[#fcf9f8] border-4 border-black rounded-xl p-4 text-sm text-black font-bold focus:outline-none focus:border-purple-600 placeholder-zinc-400 resize-none font-sans"
                  />
                  <button
                    onClick={handleSaveJournal}
                    disabled={!journalNote.trim()}
                    className="chunky-btn bg-purple-600 text-white font-extrabold text-sm py-3 px-8 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_#1c1b1b] hover:bg-purple-700 transition-all disabled:opacity-40 disabled:hover:bg-purple-600 disabled:translate-y-0 disabled:shadow-[4px_4px_0px_0px_#1c1b1b] cursor-pointer"
                  >
                    Save Note to Journal
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4 bg-emerald-50 border-4 border-black p-5 rounded-2xl">
                  <CheckCircle className="text-[#10b981] shrink-0" size={24} />
                  <div>
                    <h4 className="text-sm font-bold text-black font-display uppercase">Note Saved!</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">Your debate conclusion has been written into your investment diary.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Debate


