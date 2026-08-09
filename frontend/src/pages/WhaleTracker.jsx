import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useVibeStore } from '../store/vibeStore'
import { RainbowRibbon } from '../components/shared/RainbowRibbon'
import { api } from '../lib/api'
import { 
  ShieldAlert, RefreshCcw, Eye, ArrowUpRight, ArrowDownRight, 
  User, Plus, Trash2, Award, CheckCircle, BellRing
} from 'lucide-react'

export function WhaleTracker() {
  const { user, watchlist, awardXP } = useVibeStore()

  const [trades, setTrades] = useState([])
  const [fiiDii, setFiiDii] = useState(null)
  const [insider, setInsider] = useState([])
  const [mfBuying, setMfBuying] = useState([])
  const [alerts, setAlerts] = useState([])
  
  const [selectedTicker, setSelectedTicker] = useState('')
  const [alertThreshold, setAlertThreshold] = useState(10) // 10 Cr default
  const [loadingAlerts, setLoadingAlerts] = useState(false)
  const [xpAwardedForPage, setXpAwardedForPage] = useState(false)

  const sseRef = useRef(null)
  const pageTimerRef = useRef(null)

  const fetchFlowsAndDeals = async () => {
    try {
      const flowsResp = await api.get('/whale/fii-dii')
      setFiiDii(flowsResp.data)

      const insiderResp = await api.get('/whale/insider-trades')
      setInsider(insiderResp.data.trades)

      const mfResp = await api.get('/whale/mf-buying')
      setMfBuying(mfResp.data.buying)
    } catch (err) {
      console.error('Failed to load whale metrics:', err)
    }
  }

  const fetchAlerts = async () => {
    if (!user) return
    setLoadingAlerts(true)
    try {
      const response = await api.get(`/whale/alerts/${user.id}`)
      setAlerts(response.data.alerts)
    } catch (err) {
      console.error('Failed to load alerts:', err)
    } finally {
      setLoadingAlerts(false)
    }
  }

  useEffect(() => {
    fetchFlowsAndDeals()
    fetchAlerts()

    if (watchlist && watchlist.length > 0) {
      setSelectedTicker(watchlist[0])
    }

    // Set up SSE Event Source for Block Trades
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    sseRef.current = new EventSource(`${apiBaseUrl}/api/whale/block-trades`)

    sseRef.current.onmessage = (event) => {
      try {
        const trade = JSON.parse(event.data)
        setTrades(prev => [trade, ...prev].slice(0, 10)) // Keep latest 10
      } catch (err) {
        console.warn('Failed to parse block trade event:', err)
      }
    }

    // Page view XP award (15 XP after 60s)
    pageTimerRef.current = setTimeout(() => {
      awardXP('whale_tracker_view', 15)
      setXpAwardedForPage(true)
    }, 60000)

    return () => {
      if (sseRef.current) sseRef.current.close()
      clearTimeout(pageTimerRef.current)
    }
  }, [])

  const handleCreateAlert = async (e) => {
    e.preventDefault()
    if (!user || !selectedTicker) return
    try {
      await api.post('/whale/alerts', {
        user_id: user.id,
        ticker: selectedTicker.toUpperCase(),
        threshold: parseFloat(alertThreshold)
      })
      fetchAlerts()
    } catch (err) {
      console.error('Failed to create alert:', err)
    }
  }

  const handleDeleteAlert = async (alertId) => {
    if (!user) return
    try {
      await api.delete(`/whale/alerts/${alertId}?user_id=${user.id}`)
      fetchAlerts()
    } catch (err) {
      console.error('Failed to delete alert:', err)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-6xl mx-auto px-4 pt-4 pb-32 text-left relative"
    >
      <RainbowRibbon className="w-full h-24 top-0 left-0" />

      {/* Heading */}
      <div className="relative z-10 mb-8 mt-10">
        <h1 className="text-4xl md:text-5xl font-black font-display text-black uppercase tracking-tight relative inline-block">
          WHALE TRACKER 🐳
          <svg className="absolute top-full left-0 w-full h-3 text-blue-500" viewBox="0 0 100 10" preserveAspectRatio="none">
            <path d="M0,5 Q12.5,0 25,5 T50,5 T75,5 T100,5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </h1>
        <p className="text-zinc-500 text-xs font-bold font-headline uppercase mt-4 tracking-wider">
          Follow the smart money. Live.
        </p>
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
            +15 XP Awarded for studying large cap smart-money flows! ⚡
          </span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">

        {/* PANEL 1: LIVE BLOCK TRADES */}
        <div className="sticker-card bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#1c1b1b] lg:col-span-2">
          <div className="flex justify-between items-center gap-3 mb-6">
            <h3 className="font-display font-extrabold text-lg uppercase tracking-tight text-black flex items-center gap-2">
              <span>LIVE BLOCK TRADES</span>
              <span className="text-[10px] font-black bg-emerald-50 border-2 border-[#10b981] text-emerald-600 px-2 py-0.5 rounded-full animate-pulse">
                ● LIVE
              </span>
            </h3>
            <button 
              onClick={fetchFlowsAndDeals}
              className="flex items-center gap-1 px-3 py-1.5 border-2 border-black rounded-lg bg-[#00d09c] text-xs font-extrabold shadow-[2px_2px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none cursor-pointer"
            >
              <RefreshCcw size={12} />
              <span>Sync Live</span>
            </button>
          </div>

          <div className="overflow-x-auto border-3 border-black rounded-2xl bg-zinc-50">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-3 border-black text-left font-display font-black text-xs uppercase text-zinc-500 bg-white">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-2">Side</th>
                  <th className="py-2.5 px-2">Stock</th>
                  <th className="py-2.5 px-2 text-right">Units</th>
                  <th className="py-2.5 px-2 text-right">Value</th>
                  <th className="py-2.5 px-3">Aurex Take</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {trades.map((t, idx) => (
                    <motion.tr 
                      key={`${t.ticker}-${t.time}-${idx}`}
                      initial={{ backgroundColor: '#a7f3d0' }}
                      animate={{ backgroundColor: '#f9fafb' }}
                      transition={{ duration: 1.5 }}
                      className="border-b border-zinc-200 font-headline text-xs font-bold text-black"
                    >
                      <td className="py-3 px-3 font-mono text-zinc-500 text-[10px]">{t.time}</td>
                      <td className="py-3 px-2">
                        <span className={`text-[9px] font-black uppercase border border-black px-1.5 py-0.5 rounded ${t.side === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {t.side}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col">
                          <span>{t.ticker}</span>
                          <span className="text-[8px] text-zinc-500 truncate max-w-[120px]">{t.company}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-[10px]">{t.units.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-2 text-right font-mono text-[11px] text-[#630ed4]">₹{t.value_cr} Cr</td>
                      <td className="py-3 px-3 text-zinc-600 font-sans italic text-[10px] leading-snug">"{t.aurex_take}"</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* PANEL 2: FII/DII FLOW TRACKER */}
        <div className="sticker-card bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#1c1b1b]">
          <h3 className="font-display font-extrabold text-lg uppercase tracking-tight text-black mb-1">
            FII / DII DAILY FLOW
          </h3>
          <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-6">
            Grouped 30-day net volume flow
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border-3 border-black p-3.5 rounded-2xl bg-zinc-50 text-center">
              <span className="text-[9px] font-black text-zinc-500 uppercase">FII NET TODAY</span>
              <div className={`text-xl font-black font-display mt-1 ${fiiDii?.fii_today >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                {fiiDii?.fii_today >= 0 ? "+" : ""}₹{fiiDii?.fii_today?.toLocaleString('en-IN')} Cr
              </div>
            </div>
            <div className="border-3 border-black p-3.5 rounded-2xl bg-zinc-50 text-center">
              <span className="text-[9px] font-black text-zinc-500 uppercase">DII NET TODAY</span>
              <div className={`text-xl font-black font-display mt-1 ${fiiDii?.dii_today >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                {fiiDii?.dii_today >= 0 ? "+" : ""}₹{fiiDii?.dii_today?.toLocaleString('en-IN')} Cr
              </div>
            </div>
          </div>

          <div className="h-44 border-2 border-black rounded-xl p-2 bg-zinc-50">
            {fiiDii && fiiDii.flows && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fiiDii.flows.slice(-15)}>
                  <XAxis dataKey="date" stroke="#1c1b1b" tick={{ fontSize: 8, fontFamily: 'JetBrains Mono' }} />
                  <YAxis stroke="#1c1b1b" tick={{ fontSize: 8, fontFamily: 'JetBrains Mono' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#1c1b1b', borderWidth: 2, borderRadius: 12 }}
                  />
                  <Bar dataKey="fii" fill="#ef4444" name="FII" />
                  <Bar dataKey="dii" fill="#10b981" name="DII" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-[9.5px] font-black uppercase text-zinc-500 text-center mt-3 tracking-wider">
            5-day FII: Net SOLD ₹14,200 Cr — Caution signal for large caps
          </p>
        </div>

        {/* PANEL 5: WHALE ALERTS */}
        <div className="sticker-card bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#1c1b1b]">
          <h3 className="font-display font-extrabold text-lg uppercase tracking-tight text-black mb-1">
            SET WHALE ALERTS
          </h3>
          <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-6">
            Get pinged when block trades cross your threshold
          </p>

          <form onSubmit={handleCreateAlert} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-zinc-500">Target Ticker</label>
              <select
                value={selectedTicker}
                onChange={(e) => setSelectedTicker(e.target.value)}
                className="w-full bg-zinc-50 border-3 border-black rounded-xl p-3 text-xs font-black text-black"
              >
                {watchlist && watchlist.map(sym => (
                  <option key={sym} value={sym}>{sym}</option>
                ))}
                {!watchlist || watchlist.length === 0 ? (
                  <option value="ZOMATO">ZOMATO (Default)</option>
                ) : null}
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-500">
                <span>Value Threshold</span>
                <span className="font-mono text-black text-xs font-black">₹{alertThreshold} Cr</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[#630ed4]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#630ed4] text-white border-3 border-black rounded-xl text-xs font-black uppercase shadow-[3px_3px_0px_#1c1b1b] hover:bg-[#520bc0] active:translate-y-0.5 active:shadow-none cursor-pointer flex justify-center items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Create Alert</span>
            </button>
          </form>

          {/* Active Alerts List */}
          <div className="mt-6 border-t-2 border-black border-dashed pt-4">
            <h4 className="text-[10px] font-black uppercase text-zinc-500 mb-3 flex items-center gap-1">
              <BellRing size={10} className="text-zinc-500" />
              <span>Active Alerts ({alerts.length})</span>
            </h4>
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {alerts.map(a => (
                <div key={a.id} className="flex justify-between items-center bg-zinc-50 border-2 border-black rounded-lg p-2 px-3 text-[11px] font-bold">
                  <span>{a.ticker} trades &gt; ₹{a.threshold} Cr</span>
                  <button 
                    onClick={() => handleDeleteAlert(a.id)}
                    className="p-1 text-red-500 hover:bg-red-50 border border-black/20 rounded cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="text-[10px] text-zinc-500 font-mono italic">No alert triggers active.</p>
              )}
            </div>
          </div>
        </div>

        {/* PANEL 3: PROMOTER ACTIVITY */}
        <div className="sticker-card bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#1c1b1b] lg:col-span-2">
          <h3 className="font-display font-extrabold text-lg uppercase tracking-tight text-black mb-1">
            INSIDER MOVES 🕵️
          </h3>
          <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-6">
            Latest SEBI public disclosures of promoter group buying/selling
          </p>

          <div className="space-y-4">
            {insider.map((trade, idx) => {
              const isBuy = trade.side === 'BUY'
              return (
                <div 
                  key={`${trade.ticker}-${idx}`} 
                  className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-50 border-3 border-black rounded-2xl p-4 shadow-[2px_2px_0px_#1c1b1b] transition-all
                    ${isBuy ? "border-l-[12px] border-l-[#10b981]" : "border-l-[12px] border-l-[#ef4444]"}
                  `}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-black bg-white border border-black px-1.5 py-0.5 rounded">
                        {trade.ticker}
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${isBuy ? "bg-emerald-50 text-emerald-600 border-emerald-300" : "bg-red-50 text-red-600 border-red-300"}`}>
                        {trade.side}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400">{trade.date}</span>
                    </div>
                    <p className="text-[11px] font-bold text-black mt-2 leading-snug">
                      {trade.insider} holding {trade.shares.toLocaleString()} shares ({trade.holding_pct}% of company)
                    </p>
                  </div>
                  <div className="md:w-56 text-[10px] font-bold font-headline bg-white border-2 border-black p-2.5 rounded-xl italic text-zinc-700 leading-snug">
                    {trade.aurex_read}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* PANEL 4: MUTUAL FUND FRESH BUYING */}
        <div className="sticker-card bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#1c1b1b] lg:col-span-2">
          <h3 className="font-display font-extrabold text-lg uppercase tracking-tight text-black mb-1">
            MF FRESH BUYING — LAST MONTH
          </h3>
          <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-6">
            AMFI monthly portfolio disclosure net added units
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mfBuying.map((m, idx) => (
              <div key={m.ticker} className="flex justify-between items-center border-3 border-black p-3.5 rounded-2xl bg-zinc-50 shadow-[2px_2px_0px_#1c1b1b]">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-black text-black bg-white border border-black/30 px-1.5 rounded">{m.ticker}</span>
                    {m.consensus && (
                      <span className="text-[7.5px] font-black bg-gradient-to-r from-red-500 to-yellow-500 text-white border border-black px-1.5 py-0.2 rounded" title="FII and MF are both buying!">
                        CONSENSUS
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-zinc-400 font-bold mt-1.5 truncate max-w-[150px]">{m.schemes}</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[11px] font-black text-black">+{m.units.toLocaleString()} units</div>
                  <div className="text-[9px] text-[#630ed4] font-bold">Est. ₹{m.value} Cr</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  )
}

export default WhaleTracker
