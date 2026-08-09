import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Treemap, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useVibeStore } from '../store/vibeStore'
import { RainbowRibbon } from '../components/shared/RainbowRibbon'
import { api } from '../lib/api'
import { 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
  HelpCircle, Calendar, Play, Globe, Flame, RefreshCcw, Award, CheckCircle
} from 'lucide-react'

// Custom Content renderer for Treemap
const CustomTreemapNode = ({ root, depth, x, y, width, height, index, payload, colors, name, weekly_change, onClick }) => {
  const getBGColor = (val) => {
    if (val > 2.0) return '#10b981' // strong green
    if (val >= 0.5) return '#a7f3d0' // light green
    if (val > -0.5) return '#faf7f2' // neutral cream
    if (val >= -2.0) return '#fecdd3' // light red
    return '#ef4444' // strong red
  }

  const isLightText = weekly_change > 2.0 || weekly_change < -2.0
  const color = isLightText ? '#ffffff' : '#1c1b1b'

  if (width < 25 || height < 20) return null;

  return (
    <g onClick={() => onClick(payload)}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: getBGColor(weekly_change),
          stroke: '#1c1b1b',
          strokeWidth: 2,
          cursor: 'pointer'
        }}
      />
      <text
        x={x + width / 2}
        y={y + height / 2 - 2}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fill: color,
          fontSize: width > 90 ? 11 : 9,
          fontFamily: 'JetBrains Mono',
          fontWeight: 'bold',
          pointerEvents: 'none'
        }}
      >
        {name}
      </text>
      <text
        x={x + width / 2}
        y={y + height / 2 + 10}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fill: color,
          fontSize: width > 90 ? 10 : 8,
          fontFamily: 'JetBrains Mono',
          fontWeight: 'black',
          pointerEvents: 'none'
        }}
      >
        {weekly_change > 0 ? '+' : ''}{weekly_change}%
      </text>
    </g>
  )
}

export function SectorPulse() {
  const { awardXP } = useVibeStore()
  
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdatedSec, setLastUpdatedSec] = useState(0)
  
  const [selectedSector, setSelectedSector] = useState(null)
  const [playingEarnings, setPlayingEarnings] = useState(null)
  const [earningsPlayTime, setEarningsPlayTime] = useState(0)
  const [xpAwardedForEarnings, setXpAwardedForEarnings] = useState(false)
  const [xpAwardedForPage, setXpAwardedForPage] = useState(false)

  const timerRef = useRef(null)
  const pageTimerRef = useRef(null)
  const earningsTimerRef = useRef(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/sector-pulse')
      if (response.data) {
        setData(response.data)
        setLastUpdatedSec(0)
      }
    } catch (err) {
      console.error('Failed to load sector pulse:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Refresh timer every 60s
    const refreshInterval = setInterval(fetchData, 60000)
    
    // Seconds counter
    timerRef.current = setInterval(() => {
      setLastUpdatedSec(prev => prev + 1)
    }, 1000)

    // Award +15 XP after 60s of page view
    pageTimerRef.current = setTimeout(() => {
      awardXP('sector_pulse_view', 15)
      setXpAwardedForPage(true)
    }, 60000)

    return () => {
      clearInterval(refreshInterval)
      clearInterval(timerRef.current)
      clearTimeout(pageTimerRef.current)
      if (earningsTimerRef.current) clearInterval(earningsTimerRef.current)
    }
  }, [])

  // Earnings call simulator timer
  useEffect(() => {
    if (playingEarnings) {
      setEarningsPlayTime(0)
      setXpAwardedForEarnings(false)
      if (earningsTimerRef.current) clearInterval(earningsTimerRef.current)
      
      earningsTimerRef.current = setInterval(() => {
        setEarningsPlayTime(prev => {
          const next = prev + 1
          // Simulate 2 minutes complete (we scale it down to 10 seconds for user experience but label it 2 min)
          if (next >= 10 && !xpAwardedForEarnings) {
            awardXP('earnings_call_listened', 20)
            setXpAwardedForEarnings(true)
          }
          return next
        })
      }, 1000)
    } else {
      if (earningsTimerRef.current) {
        clearInterval(earningsTimerRef.current)
      }
    }
  }, [playingEarnings])

  const getHeatmapColor = (val) => {
    if (val > 2.0) return 'text-[#10b981]'
    if (val < -2.0) return 'text-[#ef4444]'
    return 'text-zinc-700'
  }

  if (loading && !data) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 pt-20 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-black border-t-transparent rounded-full mb-4" />
        <p className="font-mono text-xs text-zinc-500">Loading economic metrics...</p>
      </div>
    )
  }
  const itSector = data?.heatmap?.find(s => s.name === 'IT') || { name: 'IT', weekly_change: -3.46, sub_stocks: [] }
  const financeSector = data?.heatmap?.find(s => s.name === 'Finance') || { name: 'Finance', weekly_change: 1.89, sub_stocks: [] }
  const consumerSector = data?.heatmap?.find(s => s.name === 'Consumer') || { name: 'Consumer', weekly_change: 3.26, sub_stocks: [] }
  const autoSector = data?.heatmap?.find(s => s.name === 'Auto') || { name: 'Auto', weekly_change: -0.81, sub_stocks: [] }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-6xl mx-auto px-4 pt-4 pb-32 text-left relative"
    >
      <RainbowRibbon className="w-full h-24 top-0 left-0" />

      {/* Top Header */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 mt-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black font-display text-black uppercase tracking-tight relative inline-block">
            SECTOR PULSE 📊
            <svg className="absolute top-full left-0 w-full h-3 text-cyan-400" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0,5 Q12.5,0 25,5 T50,5 T75,5 T100,5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </h1>
          <p className="text-zinc-500 text-xs font-bold font-headline uppercase mt-4 tracking-wider">
            The Indian economy. Right now. Plain English.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 self-stretch md:self-auto">
          <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
            Last updated: {lastUpdatedSec} seconds ago
          </div>
          <button 
            onClick={fetchData} 
            className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-black rounded-lg bg-white text-xs font-extrabold shadow-[2px_2px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <RefreshCcw size={12} className={loading ? "animate-spin" : ""} />
            <span>Sync Stats</span>
          </button>
        </div>
      </div>

      {/* XP Toast Notification */}
      {xpAwardedForPage && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="sticker-card bg-emerald-50 border-3 border-black p-3 rounded-xl mb-6 flex items-center gap-2.5 shadow-[3px_3px_0px_#1c1b1b]"
        >
          <Award size={18} className="text-[#10b981]" />
          <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-tight">
            +15 XP Awarded for studying macro market flows! ⚡
          </span>
        </motion.div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">

        {/* PANEL 1: HEATMAP */}
        <div className="sticker-card bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#1c1b1b] lg:col-span-2">
          <h3 className="font-display font-extrabold text-lg uppercase tracking-tight text-black mb-1">
            SECTOR PERFORMANCE THIS WEEK
          </h3>
          <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-6">
            NSE sectors weighted by market cap weight (weekly return)
          </p>

          <div className="grid grid-cols-12 grid-rows-2 h-[450px] gap-3 rounded-2xl overflow-hidden border-[3px] border-black p-3 bg-black">
            {/* IT */}
            <div 
              onClick={() => setSelectedSector(itSector)}
              className="col-span-4 row-span-2 bg-[#ff6b6b] flex flex-col items-center justify-center border-2 border-black rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span className="font-display font-black text-2xl md:text-3xl text-black">IT</span>
              <span className="font-mono font-bold text-black mt-2 text-sm md:text-base">{itSector.weekly_change > 0 ? '+' : ''}{itSector.weekly_change}%</span>
            </div>

            {/* Finance */}
            <div 
              onClick={() => setSelectedSector(financeSector)}
              className="col-span-8 row-span-1 bg-[#a7f3d0] flex flex-col items-center justify-center border-2 border-black rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span className="font-display font-black text-2xl md:text-3xl text-black">Finance</span>
              <span className="font-mono font-bold text-black mt-1 text-sm md:text-base">{financeSector.weekly_change > 0 ? '+' : ''}{financeSector.weekly_change}%</span>
            </div>

            {/* Consumer */}
            <div 
              onClick={() => setSelectedSector(consumerSector)}
              className="col-span-5 row-span-1 bg-[#ecfdf5] flex flex-col items-center justify-center border-2 border-black rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span className="font-display font-black text-xl md:text-2xl text-black">Consumer</span>
              <span className="font-mono font-bold text-black mt-1 text-xs md:text-sm">{consumerSector.weekly_change > 0 ? '+' : ''}{consumerSector.weekly_change}%</span>
            </div>

            {/* Auto */}
            <div 
              onClick={() => setSelectedSector(autoSector)}
              className="col-span-3 row-span-1 bg-[#ffd1d1] flex flex-col items-center justify-center border-2 border-black rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span className="font-display font-black text-xl md:text-2xl text-black">Auto</span>
              <span className="font-mono font-bold text-black mt-1 text-xs md:text-sm">{autoSector.weekly_change > 0 ? '+' : ''}{autoSector.weekly_change}%</span>
            </div>
          </div>

          {/* Legend / Other sectors list */}
          <div className="mt-6">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2 font-mono">Other Sectors (Click to view details)</span>
            <div className="flex flex-wrap gap-2">
              {data?.heatmap?.filter(s => !['IT', 'Finance', 'Consumer', 'Auto'].includes(s.name)).map(s => (
                <button
                  key={s.name}
                  onClick={() => setSelectedSector(s)}
                  className="px-3.5 py-1.5 rounded-xl border-2 border-black bg-white hover:bg-zinc-50 text-[10px] font-black font-headline shadow-[2px_2px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  {s.name} ({s.weekly_change > 0 ? '+' : ''}{s.weekly_change}%)
                </button>
              ))}
            </div>
          </div>

          {/* Aurex Heatmap insight */}
          <div className="mt-5 border-3 border-black border-dashed p-4 rounded-xl bg-zinc-50 flex gap-3 items-center">
            <span className="bg-[#630ed4] text-white text-[9px] font-black px-2 py-1 border-2 border-black rounded shadow-[2px_2px_0px_#1c1b1b] rotate-[-2deg] shrink-0">
              AUREX INSIGHT
            </span>
            <p className="text-zinc-800 font-sans text-xs font-bold leading-relaxed">
              "{data?.aurex_heatmap_insight}"
            </p>
          </div>
        </div>

        {/* PANEL 2: FII vs DII */}
        <div className="sticker-card bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#1c1b1b]">
          <h3 className="font-display font-extrabold text-lg uppercase tracking-tight text-black mb-1">
            FII vs DII — WHO'S WINNING? 💰
          </h3>
          <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-6">
            Institutional net flows (last 10 days in ₹Cr)
          </p>

          <div className="h-60 border-2 border-black rounded-xl p-2 bg-zinc-50">
            {data && data.fii_dii && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.fii_dii}>
                  <XAxis dataKey="date" stroke="#1c1b1b" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fontWeight: 'bold' }} />
                  <YAxis stroke="#1c1b1b" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fontWeight: 'bold' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#1c1b1b', borderWidth: 3, borderRadius: 16 }}
                    labelStyle={{ fontFamily: 'Syne', fontWeight: 'bold' }}
                    itemStyle={{ fontFamily: 'JetBrains Mono', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="fii" fill="#0284c7" name="FII Net" stroke="#1c1b1b" strokeWidth={1.5} />
                  <Bar dataKey="dii" fill="#10b981" name="DII Net" stroke="#1c1b1b" strokeWidth={1.5} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="text-[11px] font-bold font-headline text-zinc-700 mt-4 leading-relaxed bg-zinc-50 border-2 border-black rounded-lg p-3">
            {data?.fii_dii_summary}
          </div>
        </div>

        {/* PANEL 3: RUPEE PULSE */}
        <div className="sticker-card bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#1c1b1b]">
          <h3 className="font-display font-extrabold text-lg uppercase tracking-tight text-black mb-1">
            ₹ RUPEE PULSE
          </h3>
          <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-6">
            USDINR Exchange Rate (last 30 days)
          </p>

          <div className="flex justify-between items-baseline mb-4">
            <span className="text-3xl font-black font-mono text-black">
              ₹{data?.usdinr?.rate}
            </span>
            <span className={`text-xs font-black font-mono ${data?.usdinr?.change >= 0 ? "text-[#ef4444]" : "text-[#10b981]"}`}>
              {data?.usdinr?.change >= 0 ? "↑ Weakened" : "↓ Strengthened"} ({Math.abs(data?.usdinr?.change)}%)
            </span>
          </div>

          <div className="h-44 border-2 border-black rounded-xl p-2 bg-zinc-50">
            {data && data.usdinr?.history && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.usdinr.history}>
                  <XAxis dataKey="date" stroke="#1c1b1b" tick={{ fontSize: 8, fontFamily: 'JetBrains Mono' }} />
                  <YAxis domain={['auto', 'auto']} stroke="#1c1b1b" tick={{ fontSize: 8, fontFamily: 'JetBrains Mono' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#1c1b1b', borderWidth: 2, borderRadius: 12 }}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#7c3aed" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="text-[11px] font-bold font-headline mt-4 text-zinc-800 bg-zinc-50 border-2 border-black rounded-lg p-3">
            {data?.aurex_usdinr_insight}
          </div>
        </div>

        {/* PANEL 4: COMMODITY CORNER */}
        <div className="sticker-card bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#1c1b1b] lg:col-span-2">
          <h3 className="font-display font-extrabold text-lg uppercase tracking-tight text-black mb-1">
            COMMODITY CORNER
          </h3>
          <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-6">
            Global resources index & sector exposure mapping
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {data && data.commodities && data.commodities.map((c) => {
              const isUp = c.change >= 0
              return (
                <div key={c.name} className="border-3 border-black p-4 rounded-2xl bg-zinc-50 relative overflow-hidden shadow-[2px_2px_0px_#1c1b1b]">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black uppercase text-zinc-500">{c.name}</span>
                    <span className={`text-[10px] font-black font-mono flex items-center ${isUp ? "text-[#2e7d32]" : "text-[#c62828]"}`}>
                      {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                      {Math.abs(c.change)}%
                    </span>
                  </div>
                  <div className="text-lg font-black font-mono text-black">${c.price}</div>
                  <div className="text-[9px] font-bold text-zinc-600 mt-3 leading-tight border-t border-dashed border-zinc-300 pt-2 font-headline italic">
                    "{c.aurex_take}"
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* PANEL 5: RESULTS CALENDAR */}
        <div className="sticker-card bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#1c1b1b] lg:col-span-2">
          <h3 className="font-display font-extrabold text-lg uppercase tracking-tight text-black mb-1">
            EARNINGS THIS WEEK 📅
          </h3>
          <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-6">
            Q1 NSE earnings announcements - Click row to listen/unlock +20 XP
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-3 border-black text-left font-display font-black text-xs uppercase text-zinc-500">
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-2">Ticker</th>
                  <th className="py-2.5 px-2">Date & Time</th>
                  <th className="py-2.5 px-2">Type</th>
                  <th className="py-2.5 px-2 text-right">Expected EPS</th>
                  <th className="py-2.5 px-2 text-right">Prior EPS</th>
                </tr>
              </thead>
              <tbody>
                {data && data.earnings_calendar && data.earnings_calendar.map((e) => (
                  <tr 
                    key={e.ticker} 
                    onClick={() => setPlayingEarnings(e)}
                    className="border-b border-zinc-200 hover:bg-zinc-50 cursor-pointer font-headline text-xs font-bold text-black"
                  >
                    <td className="py-3.5 px-3 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full border-2 border-black bg-zinc-100 flex items-center justify-center font-bold text-[10px]">
                        {e.company[0]}
                      </div>
                      <span>{e.company}</span>
                    </td>
                    <td className="py-3.5 px-2">
                      <span className="font-mono bg-zinc-100 border border-black/20 px-1.5 py-0.5 rounded text-[10px]">{e.ticker}</span>
                    </td>
                    <td className="py-3.5 px-2 text-zinc-600 font-mono text-[10px]">{e.date} · {e.time}</td>
                    <td className="py-3.5 px-2 text-zinc-600 font-mono text-[10px]">{e.type}</td>
                    <td className="py-3.5 px-2 text-right font-mono text-[11px]">₹{e.expected_eps}</td>
                    <td className="py-3.5 px-2 text-right font-mono text-[11px] text-zinc-500">₹{e.prior_eps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PANEL 6: GLOBAL MOOD */}
        <div className="sticker-card bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#1c1b1b] lg:col-span-2">
          <h3 className="font-display font-extrabold text-lg uppercase tracking-tight text-black mb-1">
            GLOBAL MOOD 🌍
          </h3>
          <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-6">
            Major indices performance and Aurex open call
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {data && data.global_mood && data.global_mood.map((g) => {
              const isUp = g.change >= 0
              return (
                <div key={g.name} className="border-3 border-black p-3 rounded-xl bg-zinc-50 text-center shadow-[2px_2px_0px_#1c1b1b]">
                  <div className="text-[10px] font-black text-zinc-500 uppercase flex justify-center items-center gap-1">
                    <Globe size={10} />
                    <span>{g.name}</span>
                  </div>
                  <div className="text-sm font-black font-mono text-black mt-1.5">{g.price.toLocaleString()}</div>
                  <div className={`text-[10px] font-black font-mono mt-1 ${isUp ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                    {isUp ? "↑" : "↓"} {Math.abs(g.change)}%
                  </div>
                </div>
              )
            })}
          </div>

          <div className="border-3 border-black border-dashed p-4 rounded-xl bg-zinc-50 flex gap-3 items-center">
            <span className="bg-[#fd56a7] text-white text-[9px] font-black px-2 py-1 border-2 border-black rounded shadow-[2px_2px_0px_#1c1b1b] rotate-[2deg] shrink-0">
              GLOBAL SUMMARY
            </span>
            <p className="text-zinc-800 font-sans text-xs font-bold leading-relaxed">
              "{data?.aurex_global_summary}"
            </p>
          </div>
        </div>

      </div>

      {/* SECTOR STOCKS EXPAND MODAL */}
      <AnimatePresence>
        {selectedSector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white border-4 border-black rounded-3xl p-6 max-w-sm w-full shadow-[8px_8px_0px_#1c1b1b] relative text-left">
              <button 
                onClick={() => setSelectedSector(null)}
                className="absolute top-4 right-4 p-1 rounded-lg border-2 border-black bg-white hover:bg-zinc-50 shadow-[2px_2px_0px_#1c1b1b]"
              >
                <X size={14} />
              </button>

              <h4 className="font-display font-black text-lg uppercase tracking-tight text-black mb-1">
                {selectedSector.name} Sector details
              </h4>
              <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-5">
                Top stocks weekly returns summary
              </p>

              <div className="space-y-3.5 mb-2">
                {selectedSector.sub_stocks && selectedSector.sub_stocks.map((stock) => (
                  <div key={stock.ticker} className="flex justify-between items-center border-b border-zinc-100 pb-2 last:border-0">
                    <span className="font-mono font-black text-sm text-black bg-zinc-100 border border-black/20 px-2 py-0.5 rounded">
                      {stock.ticker}
                    </span>
                    <span className={`font-mono font-black text-xs ${stock.change >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                      {stock.change >= 0 ? "+" : ""}{stock.change}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EARNINGS CALL SIMULATOR MODAL */}
      <AnimatePresence>
        {playingEarnings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white border-4 border-black rounded-3xl p-6 max-w-md w-full shadow-[8px_8px_0px_#1c1b1b] relative text-left">
              <button 
                onClick={() => setPlayingEarnings(null)}
                className="absolute top-4 right-4 p-1 rounded-lg border-2 border-black bg-white hover:bg-zinc-50 shadow-[2px_2px_0px_#1c1b1b]"
              >
                <X size={14} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full border-3 border-black bg-[#fde047] flex items-center justify-center font-black">
                  🎙️
                </div>
                <div>
                  <h4 className="font-display font-black text-base uppercase text-black leading-tight">
                    Mock Earnings Player
                  </h4>
                  <p className="text-zinc-400 text-[9px] uppercase font-bold tracking-wider mt-0.5">
                    {playingEarnings.company} ({playingEarnings.ticker})
                  </p>
                </div>
              </div>

              {/* Player UI */}
              <div className="bg-[#1c1b1b] text-white p-5 border-3 border-black rounded-2xl relative shadow-[inner_3px_3px_6px_rgba(0,0,0,0.4)]">
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 mb-3 uppercase tracking-wider">
                  <span>Q1 FY26 Conference Call</span>
                  <span className="text-[#00d09c] animate-pulse">● LIVE TRANSCRIPTION</span>
                </div>
                
                {/* Waveforms */}
                <div className="flex items-center gap-1.5 h-16 justify-center my-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((bar) => (
                    <motion.div
                      key={bar}
                      animate={{ height: [8, Math.floor(Math.random() * 30) + 18, 8] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: bar * 0.05 }}
                      className="w-1 bg-[#00d09c] rounded-full"
                    />
                  ))}
                </div>

                <div className="text-center font-headline text-sm font-bold text-white px-2">
                  "Analyst Consensus: {playingEarnings.surprise}"
                </div>

                <div className="mt-4 flex justify-between items-center text-[10px] font-mono text-zinc-400 pt-2 border-t border-white/10">
                  <span>Time Listening: 0:{earningsPlayTime < 10 ? '0' : ''}{earningsPlayTime} / 2:00</span>
                  <span>+20 XP Target</span>
                </div>
              </div>

              {/* XP Confirmation Message */}
              <AnimatePresence>
                {xpAwardedForEarnings ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 bg-emerald-50 border-2 border-black p-3.5 rounded-xl flex items-center gap-2.5"
                  >
                    <CheckCircle size={18} className="text-[#10b981]" />
                    <div>
                      <h5 className="text-[11px] font-black text-emerald-800 uppercase tracking-tight">XP Earned!</h5>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Unlocked +20 XP for attending the Q1 earnings call.</p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-[10px] font-bold text-center text-zinc-500 mt-4 font-headline">
                    Listen for 10 seconds to award +20 XP. Keep this screen active.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default SectorPulse
