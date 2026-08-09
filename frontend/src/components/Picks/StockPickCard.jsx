import React, { useState, useEffect } from 'react'
import { useVibeStore } from '../../store/vibeStore'
import { ExternalLink, TrendingUp } from 'lucide-react'
import { api } from '../../lib/api'
import { AreaChart, Area, ResponsiveContainer, ReferenceArea, YAxis, XAxis, Tooltip } from 'recharts'
import { motion } from 'framer-motion'
import ModelBadge from '../shared/ModelBadge'

export function StockPickCard({ pick, index = 0 }) {
  const { addHolding, holdings, setActivePage, setActiveDebateTicker, unlockCard } = useVibeStore()
  const [paperTraded, setPaperTraded] = useState(false)
  const [timeframe, setTimeframe] = useState('3M')

  const isAlreadyInPortfolio = holdings.some(
    (h) => h.ticker === pick.ticker.toUpperCase() && h.is_paper
  )

  const handlePaperTrade = async (e) => {
    e.stopPropagation()
    if (isAlreadyInPortfolio || paperTraded) return

    const today = new Date().toISOString().split('T')[0]
    await addHolding({
      ticker: pick.ticker,
      exchange: pick.exchange || 'NSE',
      quantity: Math.floor(5000 / pick.price) || 1, // Default ₹5000 worth
      avg_buy_price: pick.price,
      buy_date: today,
      is_paper: true
    })
    setPaperTraded(true)
    // Attempt to unlock a card for trading this stock
    if (unlockCard) unlockCard(pick.ticker)
  }

  const handleDebate = (e) => {
    e.stopPropagation()
    if (setActiveDebateTicker) {
      setActiveDebateTicker(pick.ticker)
    }
    // Attempt to unlock a card for debating this stock
    if (unlockCard) unlockCard(pick.ticker)
    setActivePage('debate')
  }

  const handleGroww = (e) => {
    e.stopPropagation()
    const cleanSymbol = pick.ticker.replace('.NS', '').replace('.BO', '').toLowerCase()
    const growwUrl = `https://groww.in/stocks/${cleanSymbol}?utm_source=vibeup&utm_medium=app`
    window.open(growwUrl, '_blank')
  }

  const [history, setHistory] = useState([])
  const [loadingChart, setLoadingChart] = useState(false)

  useEffect(() => {
    let active = true
    const fetchHistory = async () => {
      setLoadingChart(true)
      try {
        let period = '3mo'
        if (timeframe === '1M') period = '1mo'
        if (timeframe === '1Y') period = '1y'

        const response = await api.get(`/market/historical/${pick.ticker.toUpperCase()}?period=${period}`)
        if (response.data && response.data.length > 0 && active) {
          setHistory(response.data)
        } else {
          throw new Error('Empty historical data')
        }
      } catch (err) {
        console.warn('Failed to fetch sparkline history for ' + pick.ticker + ', using simulation:', err)
        // Simulated historical curve based on timeframe length
        const simulated = []
        const length = timeframe === '1M' ? 22 : timeframe === '1Y' ? 250 : 65
        let base = pick.price * 0.92
        for (let i = 0; i < length; i++) {
          base = base * (1 + (Math.random() - 0.47) * 0.015)
          simulated.push({ time: i, close: base })
        }
        if (active) setHistory(simulated)
      } finally {
        if (active) setLoadingChart(false)
      }
    }
    fetchHistory()
    return () => { active = false }
  }, [pick.ticker, pick.price, timeframe])

  const isBuy = pick.action === 'BUY'
  const isAvoid = pick.action === 'AVOID'

  // Alternating card tilt layout from Stitch design
  const rotationClass = index % 2 === 0 ? '-rotate-1' : 'rotate-1 lg:mt-16'

  const getShadowColor = () => {
    if (pick.ticker.toUpperCase() === 'ZOMATO') return '#fde047'
    if (pick.ticker.toUpperCase() === 'TATAMOTORS') return '#ffb0cd'
    if (index % 2 === 0) return '#7dd3fc'
    return '#ffb690'
  }

  const getActionBadgeStyle = () => {
    if (isBuy) {
      return 'bg-[#10b981] text-white rotate-[6deg] shadow-[4px_4px_0px_0px_#1c1b1b]'
    }
    if (isAvoid) {
      return 'bg-[#ba1a1a] text-white rotate-[-6deg] shadow-[4px_4px_0px_0px_#1c1b1b]'
    }
    return 'bg-[#e5e2e1] text-[#1c1b1b] rotate-[-8deg] shadow-[4px_4px_0px_0px_#1c1b1b]'
  }

  // Calculate dynamic range for YAxis to ensure the chart fits nicely
  const closes = history.map(h => h.close).filter(v => v !== undefined && !isNaN(v))
  const yMin = closes.length > 0 ? Math.min(...closes) : 0
  const yMax = closes.length > 0 ? Math.max(...closes) : 100
  const yPadding = (yMax - yMin) * 0.15 || 5
  const domainMin = Math.max(0, yMin - yPadding)
  const domainMax = yMax + yPadding

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: (index % 3) * 0.05 }}
      className={`bg-white border-4 border-black rounded-3xl p-5 md:p-6 w-full relative transition-all duration-300 transform select-none flex flex-col justify-between shadow-[8px_8px_0px_#1c1b1b] hover:scale-[1.02] hover:-translate-y-2 hover:rotate-0 hover:shadow-[12px_12px_0px_#1c1b1b] z-10 hover:z-20 ${rotationClass}`}
    >
      
      {/* Header Info */}
      <div className="flex justify-between items-start mb-6">
        <div className="text-left flex flex-col items-start gap-2">
          <h2 
            className="font-display text-2xl md:text-3xl leading-none mb-1 font-bold text-black tracking-tight"
            style={{ filter: `drop-shadow(2px 2px 0px ${getShadowColor()})` }}
          >
            {pick.name}
          </h2>
          <span className={`font-mono text-[11px] font-bold px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block transform ${index % 2 === 0 ? 'rotate-2' : '-rotate-2'} ${isBuy ? 'bg-[#ffdbca] text-[#341100]' : 'bg-[#e5e2e1] text-[#1c1b1b]'}`}>
            {pick.ticker}
          </span>
        </div>
        
        {/* Conviction Badge */}
        <div className={`
          border-3 border-black px-6 py-2 rounded-full font-bold text-xl tracking-wider uppercase select-none
          ${getActionBadgeStyle()}
        `}>
          {pick.action}
        </div>
      </div>

      {/* Pricing block */}
      <div className={`grid grid-cols-3 gap-2 mb-6 bg-white p-4 rounded-xl border-3 border-black border-dashed shadow-inner ${!isBuy ? 'opacity-70' : ''}`}>
        <div className="text-center">
          <p className="text-xs uppercase font-bold text-zinc-400 mb-1">CMP</p>
          <p className="font-mono text-lg font-bold text-black">₹{pick.price.toLocaleString('en-IN')}</p>
        </div>
        <div className="text-center border-l-2 border-r-2 border-black border-dashed">
          <p className="text-xs uppercase font-bold text-zinc-400 mb-1">Target</p>
          <p className="font-mono text-lg font-bold text-[#10b981]">{pick.target ? `₹${pick.target.toLocaleString('en-IN')}` : '-'}</p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase font-bold text-zinc-400 mb-1">Stop Loss</p>
          <p className="font-mono text-lg font-bold text-[#ef4444]">{pick.stop_loss ? `₹${pick.stop_loss.toLocaleString('en-IN')}` : '-'}</p>
        </div>
      </div>

      {/* Upside Potential Box (rendered above chart in Stitch mockup) */}
      <div className={`
        flex flex-col items-center justify-center mb-6 border-3 border-black rounded-xl p-3 transform rotate-1 shadow-[4px_4px_0px_rgba(0,0,0,1)]
        ${isBuy ? 'bg-[#c8e6c9]' : 'bg-[#e5e2e1] opacity-70'}
      `}>
        <p className="text-sm uppercase font-bold text-zinc-600 mb-1">Upside Potential</p>
        <p className={`font-display text-4xl font-extrabold ${isBuy ? 'text-[#2e7d32] drop-shadow-[2px_2px_0px_#ffffff]' : 'text-zinc-600'}`}>
          {pick.upside ? `${pick.upside >= 0 ? '+' : ''}${pick.upside}%` : '--'}
        </p>
      </div>

      {/* Price Sparkline & Entry Zone (h-44 height for better visibility) */}
      <div className="w-full h-44 bg-[#f6f3f2] rounded-xl border-4 border-black relative mb-6 overflow-hidden flex flex-col justify-end shadow-inner select-none">
        {/* Grid Lines Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(26,26,26,0.08)_2px,transparent_2px),linear-gradient(to_bottom,rgba(26,26,26,0.08)_2px,transparent_2px)] bg-[size:32px_32px] pointer-events-none z-0"></div>
        
        {/* Timeframe Selector */}
        <div className="absolute top-2 left-2 flex gap-1 z-20">
          {['1M', '3M', '1Y'].map((tf) => (
            <button
              key={tf}
              onClick={(e) => { e.stopPropagation(); setTimeframe(tf); }}
              className={`
                text-[8px] font-black px-2 py-0.5 rounded border border-black transition-all cursor-pointer shadow-[1px_1px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-[0px_0px_0px_#1c1b1b]
                ${timeframe === tf 
                  ? 'bg-[#fd56a7] text-white' 
                  : 'bg-white text-zinc-600 hover:bg-zinc-50'
                }
              `}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Entry Zone badge if BUY */}
        {isBuy && (
          <span className="absolute right-2 top-2 text-[8px] font-bold bg-[#fde047] text-black px-2 py-0.5 rounded border-2 border-black transform rotate-6 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] z-20">
            Entry Zone 🔥
          </span>
        )}

        <div className="w-full h-[85%] relative z-10">
          {loadingChart ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xs font-bold text-zinc-400 font-mono animate-pulse">Loading...</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 5, left: 5, bottom: 0 }}>
                <XAxis 
                  dataKey="time" 
                  hide={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 7, fill: '#71717a', fontWeight: 'bold', fontFamily: 'JetBrains Mono' }}
                  height={14}
                />
                <YAxis 
                  domain={[domainMin, domainMax]} 
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 7, fill: '#71717a', fontWeight: 'bold', fontFamily: 'JetBrains Mono' }}
                  width={35}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '3px solid #1c1b1b', 
                    borderRadius: '10px', 
                    boxShadow: '3px 3px 0px #1c1b1b',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    color: '#1c1b1b',
                    padding: '4px 8px'
                  }}
                  labelStyle={{ color: '#71717a' }}
                  formatter={(value) => ["₹" + parseFloat(value).toFixed(2), "Price"]}
                  labelFormatter={(label) => "Date: " + label}
                />
                
                {/* Highlighted Entry Zone (last 30% of chart) if BUY */}
                {isBuy && history.length > 0 && (
                  <ReferenceArea
                    x1={history[Math.max(0, history.length - 8)]?.time}
                    x2={history[history.length - 1]?.time}
                    fill="#fd56a7"
                    fillOpacity={0.3}
                  />
                )}
                
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={isBuy ? '#630ed4' : '#fd56a7'}
                  fill={isBuy ? 'rgba(99, 14, 212, 0.1)' : 'rgba(253, 86, 167, 0.1)'}
                  strokeWidth={3}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Thesis Checkpoints */}
      <div className="mb-8 p-5 bg-white border-3 border-black rounded-2xl shadow-[4px_4px_0px_#1c1b1b] text-left">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-[#630ed4] text-2xl shrink-0" size={24} />
            <h3 className="font-headline text-xl font-bold">The Vibe Thesis</h3>
          </div>
          <ModelBadge model="gemma" />
        </div>
        <ul className="space-y-3 font-sans font-medium text-[#1c1b1b] text-xs">
          {pick.thesis.map((th, i) => {
            const isGood = !th.toLowerCase().includes('caution') && !th.toLowerCase().includes('multiples') && !th.toLowerCase().includes('avoid') && !th.toLowerCase().includes('headwinds')
            return (
              <li key={i} className="flex items-start gap-3 leading-relaxed">
                <span className="mt-0.5 text-base shrink-0 select-none">
                  {isGood ? '✅' : '⚠️'}
                </span>
                <span>{th}</span>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-6 pl-1">
        {pick.tags.map((tag) => (
          <span 
            key={tag} 
            className="text-[9px] font-bold text-black bg-white border-2 border-black px-2 py-0.5 rounded-full shadow-[2px_2px_0px_#1c1b1b]"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-auto w-full">
        {/* Paper Trade */}
        <button
          onClick={handlePaperTrade}
          disabled={isAlreadyInPortfolio || paperTraded}
          className={`
            col-span-1 py-3 px-2 rounded-xl border-3 border-black text-[12px] font-black font-headline shadow-[3px_3px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-[0px_0px_0px_#1c1b1b] transition-all cursor-pointer whitespace-nowrap transform rotate-1
            ${isAlreadyInPortfolio || paperTraded
              ? 'bg-zinc-100 text-zinc-500 shadow-none border-dashed'
              : 'bg-white text-black hover:bg-zinc-50'
            }
          `}
        >
          {isAlreadyInPortfolio || paperTraded ? '✅ Traded' : 'Paper Trade 📝'}
        </button>

        {/* Debate */}
        <button
          onClick={handleDebate}
          className="col-span-1 py-3 px-2 rounded-xl border-3 border-black bg-[#1c1b1b] text-white text-[12px] font-black font-headline shadow-[3px_3px_0px_#630ed4] active:translate-y-0.5 active:shadow-[0px_0px_0px_#630ed4] transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#630ed4] whitespace-nowrap transform rotate-1"
        >
          Debate ⚔️
        </button>

        {/* Trade on Groww */}
        <button
          onClick={handleGroww}
          className="col-span-2 py-3.5 px-3 rounded-xl border-3 border-black bg-[#00d09c] text-black text-[13px] font-black font-headline shadow-[3px_3px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-[0px_0px_0px_#1c1b1b] transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1c1b1b] flex items-center justify-center gap-1 whitespace-nowrap transform -rotate-1"
        >
          Trade on Groww ➔
        </button>
      </div>
    </motion.div>
  )
}

export default StockPickCard
