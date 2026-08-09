import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVibeStore } from '../store/vibeStore'
import { RainbowRibbon } from '../components/shared/RainbowRibbon'
import { Search, Lock, Award, Flame, Zap, ArrowUpRight, X, Sparkles, Database, Plus, Minus, Info } from 'lucide-react'
import { GrowwButton } from '../components/Picks/GrowwButton'

export function Cards() {
  const { 
    user, 
    cards, 
    discoveredCardsCount, 
    fetchCollection, 
    setActivePage, 
    setActiveDebateTicker,
    fuseCard,
    stakeCard,
    unstakeCard
  } = useVibeStore()
  
  const [viewMode, setViewMode] = useState('album') // album | fusion | staking
  const [filterRarity, setFilterRarity] = useState('All')
  const [filterSector, setFilterSector] = useState('All')
  const [activeTab, setActiveTab] = useState('rarity') // rarity | sector
  const [sortBy, setSortBy] = useState('rarity') // rarity | vibe | ticker
  
  const [selectedCard, setSelectedCard] = useState(null)
  const [modalTab, setModalTab] = useState('lore')

  // Fusion animation states
  const [isFusing, setIsFusing] = useState(false)
  const [fusionPhase, setFusionPhase] = useState(0) // 0: initial, 1: shaking, 2: beam, 3: reveal
  const [fusingTicker, setFusingTicker] = useState('')
  const [fusedCardResult, setFusedCardResult] = useState(null)

  useEffect(() => {
    fetchCollection()
  }, [])

  const rarities = ['All', 'Common', 'Rare', 'Epic', 'Legendary']
  const sectors = ['All', 'IT', 'Finance', 'Auto', 'Pharma', 'FMCG', 'Energy', 'Metals', 'Realty', 'Infra', 'Consumer', 'Media']

  // Filter & Sort logic for album
  const filteredCards = cards.filter(c => {
    const rarityMatch = filterRarity === 'All' || c.rarity === filterRarity
    const sectorMatch = filterSector === 'All' || c.sector === filterSector
    return rarityMatch && sectorMatch
  }).sort((a, b) => {
    if (sortBy === 'vibe') {
      return b.vibe - a.vibe
    }
    if (sortBy === 'ticker') {
      return a.ticker.localeCompare(b.ticker)
    }
    // Rarity rank sorting
    const rank = { 'Legendary': 4, 'Epic': 3, 'Rare': 2, 'Common': 1 }
    const rankA = rank[a.rarity] || 0
    const rankB = rank[b.rarity] || 0
    if (rankB !== rankA) return rankB - rankA
    return a.ticker.localeCompare(b.ticker)
  })

  const getRarityStyle = (rarity) => {
    switch (rarity) {
      case 'Common':
        return 'bg-zinc-150 text-zinc-900 border-black'
      case 'Rare':
        return 'bg-blue-150 text-blue-950 border-black'
      case 'Epic':
        return 'bg-purple-150 text-purple-950 border-black'
      case 'Legendary':
        return 'bg-amber-150 text-amber-950 border-black'
      default:
        return 'bg-zinc-150 text-zinc-900 border-black'
    }
  }

  const getHexOpacityColor = (hexColor) => {
    return `${hexColor}26` // 15% opacity hex equivalent
  }

  const getCardRarityMult = (rarity) => {
    return {
      'Common': 0.1,
      'Rare': 0.2,
      'Epic': 0.5,
      'Legendary': 1.0
    }[rarity] || 0.1
  }

  const calculateTotalMultiplier = () => {
    let total = 1.0
    cards.forEach(c => {
      if (c.is_collected && c.staked_count > 0) {
        total += getCardRarityMult(c.rarity) * c.staked_count
      }
    })
    return total.toFixed(1)
  }

  const handleFuseAction = async (ticker) => {
    setFusingTicker(ticker)
    setIsFusing(true)
    setFusionPhase(1)
    
    // Simulate interactive phases for cyber vibe
    const phraseInterval = setInterval(() => {
      setFusionPhase(prev => (prev < 2 ? prev + 1 : prev))
    }, 900)

    try {
      const res = await fuseCard(ticker)
      clearInterval(phraseInterval)
      if (res && res.success) {
        setFusedCardResult(res.card)
        setFusionPhase(3) // Reveal
      } else {
        setIsFusing(false)
        alert(res?.detail || "Fusion failed. Make sure cards are not staked.")
      }
    } catch (err) {
      clearInterval(phraseInterval)
      setIsFusing(false)
      alert("Error occurred during card fusion.")
    }
  }

  const handleStakeToggle = async (card, action) => {
    if (action === 'stake') {
      await stakeCard(card.ticker)
    } else {
      await unstakeCard(card.ticker)
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

      {/* Page Heading */}
      <div className="relative z-10 mb-8 mt-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black font-display text-black uppercase tracking-tight relative inline-block">
            CARD METAVERSE 🎴
            <svg className="absolute top-full left-0 w-full h-3 text-[#fd56a7]" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0,5 Q12.5,0 25,5 T50,5 T75,5 T100,5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </h1>
          <p className="text-zinc-500 text-xs font-bold font-headline uppercase mt-4 tracking-wider">
            {discoveredCardsCount} / {cards.length || 25} cards discovered
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex bg-zinc-100 border-3 border-black p-1 rounded-xl shadow-[3px_3px_0px_#1c1b1b]">
          {[
            { id: 'album', label: '🎴 Album', color: 'bg-[#fde047]' },
            { id: 'fusion', label: '🔬 Fusion Lab', color: 'bg-[#fd56a7] text-white' },
            { id: 'staking', label: '⚡ Staking Vault', color: 'bg-[#00d09c] text-black' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`text-xs font-black uppercase px-4 py-2 rounded-lg border-2 transition-all cursor-pointer ${
                viewMode === tab.id 
                  ? `${tab.color} border-black shadow-[2px_2px_0px_black] -translate-y-0.5` 
                  : 'border-transparent text-zinc-500 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Album View */}
      {viewMode === 'album' && (
        <>
          {/* Progress Bar */}
          <div className="relative z-10 sticker-card p-5 bg-white border-3 border-black rounded-2xl shadow-[4px_4px_0px_#1c1b1b] mb-10">
            <div className="flex justify-between items-center text-xs font-black uppercase mb-2">
              <span>VibeUp Set Discovery</span>
              <span>{discoveredCardsCount}/{cards.length || 25} Collected</span>
            </div>
            <div className="w-full h-5 bg-zinc-100 rounded-full border-3 border-black overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-[#00d09c] via-[#fde047] to-[#fd56a7] transition-all duration-500 border-r-3 border-black"
                style={{ width: `${(discoveredCardsCount / (cards.length || 25)) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-500 font-mono mt-2">
              {discoveredCardsCount === (cards.length || 25) ? "🎉 VIBEUP MASTER BADGE UNLOCKED!" : "Complete the set to unlock the legendary VibeUp Master status."}
            </p>
          </div>

          {/* Filters and Sorting Tabs */}
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            {/* Filter Selection */}
            <div className="flex flex-col gap-2.5">
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('rarity')} 
                  className={`text-xs font-extrabold uppercase px-3 py-1.5 rounded-full border-2 border-black ${activeTab === 'rarity' ? 'bg-[#fde047]' : 'bg-white'}`}
                >
                  By Rarity
                </button>
                <button 
                  onClick={() => setActiveTab('sector')} 
                  className={`text-xs font-extrabold uppercase px-3 py-1.5 rounded-full border-2 border-black ${activeTab === 'sector' ? 'bg-[#fde047]' : 'bg-white'}`}
                >
                  By Sector
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mt-1">
                {activeTab === 'rarity' ? (
                  rarities.map(r => (
                    <button
                      key={r}
                      onClick={() => setFilterRarity(r)}
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border-2 ${filterRarity === r ? 'bg-black text-white border-black' : 'bg-white text-zinc-600 border-zinc-300'}`}
                    >
                      {r}
                    </button>
                  ))
                ) : (
                  sectors.map(s => (
                    <button
                      key={s}
                      onClick={() => setFilterSector(s)}
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border-2 ${filterSector === s ? 'bg-black text-white border-black' : 'bg-white text-zinc-600 border-zinc-300'}`}
                    >
                      {s}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2 self-stretch md:self-auto justify-between border-t-2 border-black border-dashed md:border-0 pt-4 md:pt-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Sort:</span>
              <div className="flex gap-1.5">
                {[
                  { id: 'rarity', label: 'Rarity' },
                  { id: 'vibe', label: 'XP' },
                  { id: 'ticker', label: 'Name' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSortBy(s.id)}
                    className={`text-[10px] font-extrabold px-3 py-1.5 border-2 border-black rounded-lg ${sortBy === s.id ? 'bg-black text-white' : 'bg-white text-black'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 relative z-10">
            {filteredCards.map((c) => {
              const isLegendary = c.rarity === 'Legendary'
              const isEpic = c.rarity === 'Epic'
              const holoClass = isLegendary ? 'holo-card-legendary' : isEpic ? 'holo-card-epic' : ''
              
              if (c.is_collected) {
                return (
                  <motion.div
                    key={c.ticker}
                    onClick={() => setSelectedCard(c)}
                    whileHover={{ y: -6, rotate: 1 }}
                    className={`group cursor-pointer border-3 border-black p-4 flex flex-col justify-between h-[310px] shadow-[5px_5px_0px_#1c1b1b] hover:shadow-[7px_7px_0px_#1c1b1b] transition-all bg-white relative ${holoClass}`}
                    style={{
                      borderRadius: '24px',
                      backgroundColor: getHexOpacityColor(c.sector_color)
                    }}
                  >
                    {(isLegendary || isEpic) && (
                      <div className="holographic-shine absolute inset-0 opacity-35 pointer-events-none z-0" />
                    )}

                    <div className="relative z-10 flex flex-col h-full justify-between">
                      {/* Sector / Rarity Badges */}
                      <div className="flex justify-between items-center gap-1">
                        <span className="text-[8px] font-black uppercase border-2 border-black px-2 py-0.5 rounded bg-white text-black font-mono shadow-[1px_1px_0px_black]">{c.sector}</span>
                        <div className="flex gap-1 items-center">
                          {c.staked_count > 0 && (
                            <span className="text-[8px] font-black uppercase border-2 border-black px-1.5 py-0.5 rounded bg-[#00d09c] text-black shadow-[1px_1px_0px_black]">⚡ Staked</span>
                          )}
                          <span className={`text-[8px] font-black uppercase border-2 border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_black] ${getRarityStyle(c.rarity)}`}>
                            {c.rarity}
                          </span>
                        </div>
                      </div>

                      {/* Sticker Circle & Title */}
                      <div className="my-auto text-center flex flex-col items-center">
                        <div className="w-14 h-14 bg-white border-3 border-black rounded-full flex items-center justify-center text-3xl shadow-[3px_3px_0px_#1c1b1b] group-hover:scale-110 transition-transform duration-200">
                          {c.emoji || "📈"}
                        </div>
                        <h3 className="text-xl font-black font-display tracking-tight text-black leading-none uppercase mt-2.5">{c.ticker}</h3>
                        <div className="flex items-center gap-1 mt-1 justify-center">
                          <p className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-tight line-clamp-1">{c.fun_name || c.name}</p>
                          {c.owned_count > 1 && (
                            <span className="text-[8.5px] font-black px-1.5 bg-black text-white rounded border border-black font-mono">x{c.owned_count}</span>
                          )}
                        </div>
                      </div>

                      {/* Stats Summary */}
                      <div className="space-y-1.5 border-t-2 border-dashed border-black/15 pt-3 mt-auto">
                        {/* Volatility */}
                        <div className="flex items-center justify-between text-[8px] font-black">
                          <span className="text-zinc-500 uppercase font-mono">VOL</span>
                          <div className="w-20 h-2 bg-zinc-200/50 rounded-full border border-black overflow-hidden">
                            <div className="h-full bg-red-500" style={{ width: `${c.volatility}%` }} />
                          </div>
                        </div>
                        {/* Momentum */}
                        <div className="flex items-center justify-between text-[8px] font-black">
                          <span className="text-zinc-500 uppercase font-mono">MOM</span>
                          <div className="w-20 h-2 bg-zinc-200/50 rounded-full border border-black overflow-hidden">
                            <div className="h-full bg-amber-400" style={{ width: `${c.momentum}%` }} />
                          </div>
                        </div>
                        {/* Fundamentals */}
                        <div className="flex items-center justify-between text-[8px] font-black">
                          <span className="text-zinc-500 uppercase font-mono">FUND</span>
                          <div className="w-20 h-2 bg-zinc-200/50 rounded-full border border-black overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${c.fundamentals}%` }} />
                          </div>
                        </div>
                        {/* Vibe */}
                        <div className="flex items-center justify-between text-[8px] font-black">
                          <span className="text-purple-650 uppercase font-mono">VIBE</span>
                          <span className="font-mono text-purple-700 font-extrabold">{c.vibe}%</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              } else {
                return (
                  <div
                    key={c.ticker}
                    className="border-3 border-black p-4 flex flex-col justify-between h-[310px] shadow-[4px_4px_0px_#1c1b1b] bg-[#f5f5f5] relative select-none"
                    style={{
                      borderRadius: '24px',
                    }}
                  >
                    <div className="absolute inset-0 bg-black/[0.04] rounded-[22px] pointer-events-none" />
                    
                    <div className="flex justify-between items-center gap-1 opacity-55 relative z-10">
                      <span className="text-[8px] font-black uppercase border-2 border-black px-2 py-0.5 rounded bg-white text-black font-mono shadow-[1px_1px_0px_black]">LOCKED</span>
                      <Lock size={12} className="text-zinc-750" />
                    </div>

                    <div className="my-auto text-center flex flex-col items-center justify-center gap-3 relative z-10">
                      <div className="w-14 h-14 rounded-full bg-zinc-200 border-3 border-black flex items-center justify-center text-zinc-500 shadow-[3px_3px_0px_#1c1b1b]">
                        <Lock size={20} className="text-black" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black font-display tracking-tight text-zinc-400 leading-none uppercase">???</h3>
                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-1.5">{c.sector} Sector Hint</p>
                      </div>
                    </div>

                    <div className="text-[8px] font-black text-center text-zinc-650 mt-auto border-t-2 border-dashed border-zinc-300 pt-3 relative z-10 font-mono">
                      Trade a {c.sector} stock to unlock
                    </div>
                  </div>
                )
              }
            })}
          </div>
        </>
      )}

      {/* Fusion Lab View */}
      {viewMode === 'fusion' && (
        <div className="relative z-10 space-y-8">
          {/* Info Banner */}
          <div className="bg-[#feeff6] border-4 border-black p-6 rounded-3xl shadow-[5px_5px_0px_black] flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="space-y-2 max-w-2xl">
              <h2 className="text-2xl font-black font-display uppercase tracking-tight flex items-center gap-2">
                🔬 Ticker Fusion Reactor
              </h2>
              <p className="text-sm font-bold text-zinc-700 leading-relaxed">
                Burn <span className="bg-[#fd56a7]/20 px-1 py-0.5 border border-[#fd56a7] rounded text-[#fd56a7] font-mono">3 duplicate unstaked copies</span> of a card to trigger an atomic fusion reaction. The reactor will synthesize a random card of a <span className="underline decoration-[#fd56a7] decoration-2">higher rarity tier</span> (Common ➔ Rare ➔ Epic ➔ Legendary).
              </p>
            </div>
            <div className="bg-white border-2 border-black px-4 py-2 rounded-xl text-xs font-mono font-black shadow-[2px_2px_0px_black] self-stretch md:self-auto text-center">
              🧪 LEVEL-UP RATIO: 3 ➔ 1
            </div>
          </div>

          {/* Fusable Cards Grid */}
          <div>
            <h3 className="text-lg font-black uppercase mb-4 font-display flex items-center gap-2">
              Available Tickers for Fusion ({cards.filter(c => c.is_collected && (c.owned_count - c.staked_count >= 3)).length})
            </h3>

            {cards.filter(c => c.is_collected && (c.owned_count - c.staked_count >= 3)).length === 0 ? (
              <div className="border-4 border-dashed border-zinc-300 rounded-3xl p-12 text-center bg-white space-y-4">
                <div className="w-16 h-16 rounded-full bg-zinc-100 border-2 border-zinc-400 mx-auto flex items-center justify-center text-3xl shadow-[2px_2px_0px_#ccc]">
                  🧪
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="text-base font-black uppercase text-zinc-500">No Fusable Cards</h4>
                  <p className="text-xs font-bold text-zinc-400 leading-relaxed">
                    You don't have at least 3 unstaked copies of any stock card. Keep trading Nifty assets or scanning reports to earn duplicate drops!
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {cards.filter(c => c.is_collected && (c.owned_count - c.staked_count >= 3)).map(c => {
                  const unstakedCount = c.owned_count - c.staked_count
                  return (
                    <div 
                      key={c.ticker}
                      className="border-3 border-black p-5 rounded-2xl bg-white shadow-[4px_4px_0px_black] flex flex-col justify-between h-56"
                      style={{ borderLeftWidth: '10px', borderLeftColor: c.sector_color }}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-black uppercase border-2 border-black px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800">{c.rarity}</span>
                          <span className="text-xs font-mono font-black bg-zinc-150 px-2 py-0.5 rounded border border-black">x{unstakedCount} Unstaked</span>
                        </div>
                        <h4 className="text-2xl font-black font-display uppercase tracking-tight mt-3 flex items-center gap-1.5">
                          <span>{c.emoji || "📈"}</span>
                          <span>{c.ticker}</span>
                        </h4>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase truncate mt-0.5">{c.fun_name || c.name}</p>
                      </div>

                      <button
                        onClick={() => handleFuseAction(c.ticker)}
                        className="w-full text-center py-2.5 bg-[#fd56a7] hover:bg-[#e2448f] text-white rounded-xl border-3 border-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
                      >
                        <span>🔬 Fuse 3x Copies</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Staking Vault View */}
      {viewMode === 'staking' && (
        <div className="relative z-10 space-y-8">
          {/* Staking Dashboard metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#e6fcf5] border-4 border-black p-6 rounded-3xl shadow-[5px_5px_0px_black] col-span-2 space-y-2">
              <h2 className="text-2xl font-black font-display uppercase tracking-tight flex items-center gap-2">
                ⚡ Portfolio Staking Vault
              </h2>
              <p className="text-sm font-bold text-zinc-700 leading-relaxed">
                Vault lock your cards to deploy them as multipliers. Staked cards actively accumulate XP bonuses and virtual passive yields on your VibeScore dashboard. Note: Locked cards cannot be used for Fusions until unstaked.
              </p>
            </div>

            <div className="bg-[#f3f0ff] border-4 border-black p-6 rounded-3xl shadow-[5px_5px_0px_black] flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-black text-purple-650 uppercase tracking-widest font-mono">ACTIVE XP BOOSTER</span>
              <div className="text-5xl font-black text-purple-700 font-display mt-2">
                {calculateTotalMultiplier()}x
              </div>
              <p className="text-[9px] font-bold text-zinc-500 uppercase mt-2">
                Base 1.0x + Multiplier rewards from locked vault cards
              </p>
            </div>
          </div>

          {/* Cards multiplier key info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { tier: 'Common', bonus: '+0.1x XP', style: 'bg-zinc-100 text-zinc-800' },
              { tier: 'Rare', bonus: '+0.2x XP', style: 'bg-blue-100 text-blue-900' },
              { tier: 'Epic', bonus: '+0.5x XP', style: 'bg-purple-100 text-purple-900' },
              { tier: 'Legendary', bonus: '+1.0x XP', style: 'bg-amber-100 text-amber-950' }
            ].map(tier => (
              <div key={tier.tier} className="bg-white border-2 border-black p-3.5 rounded-xl shadow-[2px_2px_0px_black] flex justify-between items-center text-xs font-black">
                <span className={`px-2 py-0.5 rounded border border-black ${tier.style}`}>{tier.tier}</span>
                <span className="font-mono text-emerald-700">{tier.bonus}</span>
              </div>
            ))}
          </div>

          {/* Staked Cards List */}
          <div>
            <h3 className="text-lg font-black uppercase mb-4 font-display">
              My Cards Collection ({cards.filter(c => c.is_collected).length} Discovered)
            </h3>

            {cards.filter(c => c.is_collected).length === 0 ? (
              <div className="border-4 border-dashed border-zinc-300 rounded-3xl p-12 text-center bg-white">
                <p className="text-sm font-bold text-zinc-400">Unlock stock cards first by scanning tickers and making trades!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {cards.filter(c => c.is_collected).map(c => {
                  const cardMult = getCardRarityMult(c.rarity)
                  const totalBonus = cardMult * c.staked_count
                  
                  return (
                    <div 
                      key={c.ticker}
                      className="border-3 border-black p-4 rounded-2xl bg-white shadow-[4px_4px_0px_black] flex flex-col justify-between h-[230px]"
                      style={{
                        backgroundColor: getHexOpacityColor(c.sector_color)
                      }}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[8px] font-black uppercase border border-black px-1.5 py-0.5 rounded bg-white text-black font-mono">{c.sector}</span>
                          <span className={`text-[8px] font-black uppercase border border-black px-2 py-0.5 rounded ${getRarityStyle(c.rarity)}`}>
                            {c.rarity}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-3.5">
                          <div className="w-11 h-11 rounded-full bg-white border-2 border-black flex items-center justify-center text-2xl shadow-[2px_2px_0px_black]">
                            {c.emoji || "📈"}
                          </div>
                          <div>
                            <h4 className="text-xl font-black font-display leading-none uppercase">{c.ticker}</h4>
                            <p className="text-[8.5px] font-extrabold text-zinc-500 uppercase tracking-tight mt-1 line-clamp-1">{c.fun_name || c.name}</p>
                          </div>
                        </div>

                        {/* Staked Multiplier telemetry */}
                        <div className="mt-4 bg-white/70 border border-black p-2 rounded-lg space-y-1 text-[9px] font-black">
                          <div className="flex justify-between font-mono">
                            <span>OWNED COPIES:</span>
                            <span>{c.owned_count}</span>
                          </div>
                          <div className="flex justify-between font-mono">
                            <span>STAKED IN VAULT:</span>
                            <span className={c.staked_count > 0 ? "text-[#00d09c]" : ""}>{c.staked_count} / {c.owned_count}</span>
                          </div>
                          {c.staked_count > 0 && (
                            <div className="flex justify-between font-mono text-purple-750 border-t border-dashed border-black/15 pt-1 mt-1">
                              <span>ACTIVE BOOST:</span>
                              <span>+{totalBonus.toFixed(1)}x XP</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Staking Controls */}
                      <div className="flex gap-2 mt-4">
                        <button
                          disabled={c.staked_count === 0}
                          onClick={() => handleStakeToggle(c, 'unstake')}
                          className={`flex-1 py-1.5 rounded-lg border-2 border-black text-[9px] font-black uppercase flex items-center justify-center gap-1 transition-all shadow-[2px_2px_0px_black] active:translate-y-0.5 active:shadow-none cursor-pointer ${
                            c.staked_count === 0 
                              ? 'bg-zinc-100 text-zinc-400 border-zinc-300 shadow-none cursor-not-allowed' 
                              : 'bg-red-100 hover:bg-red-200 text-red-750'
                          }`}
                        >
                          <Minus size={10} />
                          <span>Unstake</span>
                        </button>
                        
                        <button
                          disabled={c.staked_count === c.owned_count}
                          onClick={() => handleStakeToggle(c, 'stake')}
                          className={`flex-1 py-1.5 rounded-lg border-2 border-black text-[9px] font-black uppercase flex items-center justify-center gap-1 transition-all shadow-[2px_2px_0px_black] active:translate-y-0.5 active:shadow-none cursor-pointer ${
                            c.staked_count === c.owned_count 
                              ? 'bg-zinc-100 text-zinc-400 border-zinc-300 shadow-none cursor-not-allowed' 
                              : 'bg-emerald-100 hover:bg-emerald-250 text-emerald-750'
                          }`}
                        >
                          <Plus size={10} />
                          <span>Stake</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border-4 border-black rounded-3xl p-6 md:p-8 max-w-md w-full shadow-[8px_8px_0px_#1c1b1b] relative text-left"
            >
              <button 
                onClick={() => setSelectedCard(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg border-2 border-black bg-white hover:bg-zinc-50 cursor-pointer shadow-[2px_2px_0px_#1c1b1b] z-20"
              >
                <X size={16} />
              </button>

              {/* Big Card Display */}
              <div 
                className={`border-3 border-black p-6 flex flex-col justify-between h-72 relative shadow-[4px_4px_0px_#1c1b1b] overflow-hidden ${
                  selectedCard.rarity === 'Legendary' ? 'holo-card-legendary' : selectedCard.rarity === 'Epic' ? 'holo-card-epic' : ''
                }`}
                style={{
                  borderRadius: '24px',
                  backgroundColor: getHexOpacityColor(selectedCard.sector_color)
                }}
              >
                {(selectedCard.rarity === 'Legendary' || selectedCard.rarity === 'Epic') && (
                  <div className="holographic-shine absolute inset-0 opacity-30 pointer-events-none z-0" />
                )}

                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase border-2 border-black px-2 py-0.5 rounded bg-white text-black font-mono shadow-[1px_1px_0px_black]">{selectedCard.sector}</span>
                    <div className="flex gap-1.5 items-center">
                      {selectedCard.staked_count > 0 && (
                        <span className="text-[9px] font-black uppercase border-2 border-black px-2 py-0.5 rounded bg-[#00d09c] text-black shadow-[1px_1px_0px_black]">⚡ Staked</span>
                      )}
                      <span className={`text-[9px] font-black uppercase border-2 border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_black] ${getRarityStyle(selectedCard.rarity)}`}>
                        {selectedCard.rarity}
                      </span>
                    </div>
                  </div>

                  <div className="text-center my-auto flex flex-col items-center">
                    <div className="w-16 h-16 bg-white border-3 border-black rounded-full flex items-center justify-center text-4xl shadow-[3px_3px_0px_#1c1b1b]">
                      {selectedCard.emoji || "📈"}
                    </div>
                    <h2 className="text-3xl font-black font-display tracking-tight text-black mt-2 leading-none uppercase">{selectedCard.ticker}</h2>
                    <div className="flex items-center gap-1.5 mt-1 justify-center">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-tight">{selectedCard.fun_name || selectedCard.name}</p>
                      {selectedCard.owned_count > 1 && (
                        <span className="text-[10px] font-black px-2 py-0.5 bg-black text-white rounded border border-black font-mono">x{selectedCard.owned_count}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex gap-2 mt-5 mb-4 border-b-2 border-dashed border-zinc-200 pb-2">
                <button
                  onClick={() => setModalTab('lore')}
                  className={`text-xs font-black uppercase px-3.5 py-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_black] transition-all cursor-pointer ${
                    modalTab === 'lore' ? 'bg-[#fde047] translate-y-0.5 shadow-none' : 'bg-white hover:bg-zinc-50'
                  }`}
                >
                  Lore & Trivia 📚
                </button>
                <button
                  onClick={() => setModalTab('telemetry')}
                  className={`text-xs font-black uppercase px-3.5 py-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_black] transition-all cursor-pointer ${
                    modalTab === 'telemetry' ? 'bg-[#fde047] translate-y-0.5 shadow-none' : 'bg-white hover:bg-zinc-50'
                  }`}
                >
                  Telemetry 📊
                </button>
              </div>

              {/* Tab Content */}
              <div className="min-h-[160px]">
                {modalTab === 'lore' ? (
                  <div className="space-y-3">
                    <div className="bg-zinc-50 border-2 border-black rounded-xl p-3.5 shadow-[2px_2px_0px_#1c1b1b]">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest font-mono block mb-1">Vibe Description</span>
                      <p className="text-xs font-bold text-zinc-700 leading-relaxed italic">
                        "{selectedCard.description || 'A highly mysterious asset whose lore is yet to be discovered.'}"
                      </p>
                    </div>

                    <div className="bg-[#eaddff] border-2 border-black rounded-xl p-3.5 shadow-[2px_2px_0px_#1c1b1b]">
                      <span className="text-[8px] font-black text-[#630ed4] uppercase tracking-widest font-mono block mb-1">Quirky Fact</span>
                      <p className="text-xs font-bold text-[#1c1b1b] leading-relaxed">
                        {selectedCard.fun_fact || 'Legend says this ticker prints green candles when the vibes are immaculate.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 bg-[#faf7f2] border-2 border-black rounded-xl p-4 shadow-[2px_2px_0px_#1c1b1b]">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-zinc-650">
                        <span>Volatility (VOL)</span>
                        <span className="font-mono text-red-650">{selectedCard.volatility}%</span>
                      </div>
                      <div className="w-full h-3 bg-white rounded-full border-2 border-black overflow-hidden relative shadow-[1px_1px_0px_black]">
                        <div className="h-full bg-red-500 border-r-2 border-black" style={{ width: `${selectedCard.volatility}%` }} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-zinc-650">
                        <span>Momentum (MOM)</span>
                        <span className="font-mono text-amber-600">{selectedCard.momentum}%</span>
                      </div>
                      <div className="w-full h-3 bg-white rounded-full border-2 border-black overflow-hidden relative shadow-[1px_1px_0px_black]">
                        <div className="h-full bg-amber-400 border-r-2 border-black" style={{ width: `${selectedCard.momentum}%` }} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-zinc-650">
                        <span>Fundamentals (FUND)</span>
                        <span className="font-mono text-emerald-650">{selectedCard.fundamentals}%</span>
                      </div>
                      <div className="w-full h-3 bg-white rounded-full border-2 border-black overflow-hidden relative shadow-[1px_1px_0px_black]">
                        <div className="h-full bg-emerald-500 border-r-2 border-black" style={{ width: `${selectedCard.fundamentals}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-dashed border-black/25 pt-2 mt-1">
                      <span className="text-[#630ed4] font-black uppercase text-[10px] tracking-widest font-mono">Vibe Rating</span>
                      <span className="font-mono text-[#630ed4] font-black text-sm bg-purple-100 border border-[#630ed4] px-2 py-0.5 rounded shadow-[1px_1px_0px_#630ed4]">{selectedCard.vibe}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-5">
                <button
                  onClick={() => {
                    if (setActiveDebateTicker) {
                      setActiveDebateTicker(selectedCard.ticker)
                    }
                    setActivePage('debate')
                    setSelectedCard(null)
                  }}
                  className="flex items-center justify-center gap-1.5 py-3 rounded-xl border-3 border-black bg-white hover:bg-zinc-50 text-black text-xs font-black shadow-[3px_3px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  <Flame size={14} className="text-[#630ed4]" />
                  <span>Debate ⚔️</span>
                </button>

                <button
                  onClick={() => {
                    setActivePage('signals')
                    setSelectedCard(null)
                  }}
                  className="flex items-center justify-center gap-1.5 py-3 rounded-xl border-3 border-black bg-white hover:bg-zinc-50 text-black text-xs font-black shadow-[3px_3px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  <Zap size={14} className="text-yellow-500" />
                  <span>Signals ⚡</span>
                </button>
              </div>

              <div className="mt-3.5">
                <GrowwButton symbol={selectedCard.ticker} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOOTBOX FUSION REVEAL MODAL */}
      <AnimatePresence>
        {isFusing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 text-center"
          >
            {fusionPhase < 3 ? (
              <div className="space-y-8 flex flex-col items-center">
                <div className="relative">
                  {/* Glowing neon background circles */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-[#fd56a7] to-[#00d09c] rounded-full blur-2xl opacity-50 animate-pulse" />
                  
                  <motion.div
                    animate={
                      fusionPhase === 1 
                        ? { 
                            x: [0, -12, 12, -12, 12, -8, 8, 0],
                            y: [0, 8, -8, 8, -8, 4, -4, 0],
                            rotate: [0, -5, 5, -5, 5, -2, 2, 0]
                          } 
                        : {
                            scale: [1, 1.2, 0.85, 1.15, 1],
                            rotate: [0, 180, 360],
                            borderRadius: ["20%", "50%", "30%", "20%"]
                          }
                    }
                    transition={{ 
                      repeat: Infinity, 
                      duration: fusionPhase === 1 ? 0.35 : 0.7, 
                      ease: "easeInOut" 
                    }}
                    className="w-48 h-48 bg-white border-4 border-black flex items-center justify-center text-7xl shadow-[8px_8px_0px_black] relative z-10"
                    style={{ borderRadius: '32px' }}
                  >
                    {fusionPhase === 1 ? "🔬" : "⚡"}
                  </motion.div>
                </div>

                <div className="space-y-2 relative z-10">
                  <h3 className="text-3xl font-black font-display text-white uppercase tracking-tight">
                    {fusionPhase === 1 ? "Fusing Ticker Genes..." : "Synthesizing Molecular Rarity..."}
                  </h3>
                  <div className="w-64 h-4 bg-zinc-800 rounded-full border-3 border-black overflow-hidden mx-auto relative shadow-[2px_2px_0px_black]">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#fd56a7] via-[#fde047] to-[#00d09c] border-r-2 border-black"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2.2, ease: "linear" }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase pt-2">
                    Burning 3 copies of {fusingTicker} card...
                  </p>
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-8 flex flex-col items-center max-w-sm w-full"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase bg-[#fde047] text-black px-3 py-1 border-2 border-black rounded-lg shadow-[2px_2px_0px_black] font-mono tracking-widest">
                    🎉 FUSION SUCCESSFUL!
                  </span>
                  <h3 className="text-3xl font-black font-display text-white uppercase tracking-tight pt-2">
                    NEW CARD UNLOCKED!
                  </h3>
                </div>

                {fusedCardResult && (
                  <motion.div
                    initial={{ y: 50, rotate: -15, scale: 0.8 }}
                    animate={{ y: 0, rotate: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 12 }}
                    className={`border-4 border-black p-6 flex flex-col justify-between h-80 w-64 shadow-[8px_8px_0px_black] relative text-left bg-white overflow-hidden ${
                      fusedCardResult.rarity === 'Legendary' ? 'holo-card-legendary' : fusedCardResult.rarity === 'Epic' ? 'holo-card-epic' : ''
                    }`}
                    style={{
                      borderRadius: '28px',
                      backgroundColor: getHexOpacityColor(fusedCardResult.sector_color)
                    }}
                  >
                    {(fusedCardResult.rarity === 'Legendary' || fusedCardResult.rarity === 'Epic') && (
                      <div className="holographic-shine absolute inset-0 opacity-40 pointer-events-none z-0 animate-pulse" />
                    )}

                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase border-2 border-black px-2 py-0.5 rounded bg-white text-black font-mono shadow-[1px_1px_0px_black]">{fusedCardResult.sector}</span>
                        <span className={`text-[9px] font-black uppercase border-2 border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_black] ${getRarityStyle(fusedCardResult.rarity)}`}>
                          {fusedCardResult.rarity}
                        </span>
                      </div>

                      <div className="text-center my-auto flex flex-col items-center">
                        <div className="w-16 h-16 bg-white border-3 border-black rounded-full flex items-center justify-center text-4xl shadow-[3px_3px_0px_black]">
                          {fusedCardResult.emoji || "📈"}
                        </div>
                        <h2 className="text-3xl font-black font-display tracking-tight text-black mt-2 leading-none uppercase">{fusedCardResult.ticker}</h2>
                        <p className="text-[10px] font-black text-zinc-500 mt-1 uppercase tracking-tight">{fusedCardResult.fun_name || fusedCardResult.name}</p>
                      </div>

                      <div className="text-[9px] font-black text-center text-zinc-550 border-t border-dashed border-black/20 pt-2 font-mono uppercase">
                        VIBE RATING: {fusedCardResult.vibe}%
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-4 w-full">
                  <div className="bg-[#eaddff] border-3 border-black p-3.5 rounded-xl shadow-[3px_3px_0px_black] text-xs font-bold text-[#1c1b1b] flex items-center justify-center gap-2">
                    <Award size={16} className="text-[#630ed4]" />
                    <span>Reward Unlocked: +40 XP awarded to your Portfolio! 🎴</span>
                  </div>

                  <button
                    onClick={() => {
                      setIsFusing(false)
                      setFusedCardResult(null)
                    }}
                    className="w-full py-3 bg-[#00d09c] hover:bg-[#02b387] text-black border-3 border-black rounded-2xl text-sm font-black uppercase tracking-wider shadow-[4px_4px_0px_black] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                  >
                    Awesome, take me back!
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Cards
