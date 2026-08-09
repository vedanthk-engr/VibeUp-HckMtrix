import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVibeStore } from '../store/vibeStore'
import { supabase } from '../lib/supabase'
import { 
  Volume2, Moon, RotateCcw, Sparkles, Play, Activity, Check, Lock, Award, Gift, Zap
} from 'lucide-react'

const ARCHETYPE_DETAILS = {
  'Optimizer': {
    name: 'The Optimizer',
    icon: 'OPT',
    color: '#bbf7d0',
    textColor: 'text-emerald-800',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-400',
    badgeBg: 'bg-emerald-100 text-emerald-900',
    shadowColor: '#10b981',
    headerBg: '#bbf7d0',
    description: 'You evaluate the metrics, purchase on dips, and maintain high capital safety.',
    specialMove: 'Dip Devourer',
    specialMoveDesc: 'Automatically snaps up local bottoms when panic indices spike, securing maximum safety margins.',
    stats: [
      { label: 'Risk Appetite', value: 40, barColor: '#fd56a7' },
      { label: 'FOMO Reflex', value: 15, barColor: '#fbbf24' },
      { label: 'HODL Strength', value: 85, barColor: '#7c3aed' },
      { label: 'Safety Net', value: 90, barColor: '#00d09c' }
    ],
    strengths: ['High Safety', 'Disciplined', 'Low Drawdowns'],
    weaknesses: ['Misses Hype', 'Slow Bull Gains'],
    voiceQuote: "No cap, your portfolio is looking extremely safe. I computed a 98% probability that we sleep well tonight. Let's stack some more blue-chips."
  },
  'Slow Builder': {
    name: 'The Slow Builder',
    icon: 'SLW',
    color: '#eaddff',
    textColor: 'text-purple-800',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    badgeBg: 'bg-purple-100 text-purple-900',
    shadowColor: '#a78bfa',
    headerBg: '#eaddff',
    description: 'You play the long game. Compounding index portfolios are your best friends.',
    specialMove: '8th Wonder Fortress',
    specialMoveDesc: 'Unlocks exponential compounding growth by locking up index assets through all market weather.',
    stats: [
      { label: 'Risk Appetite', value: 20, barColor: '#fd56a7' },
      { label: 'FOMO Reflex', value: 5, barColor: '#fbbf24' },
      { label: 'HODL Strength', value: 98, barColor: '#7c3aed' },
      { label: 'Safety Net', value: 95, barColor: '#00d09c' }
    ],
    strengths: ['Patient Growth', 'Zen Mode', 'Low Fees'],
    weaknesses: ['Boring Trades', 'Very Slow Start'],
    voiceQuote: "Compound interest is the main vibe, bestie. Let the index funds cook in peace. Don't look at it every 5 minutes."
  },
  'FOMO Trader': {
    name: 'The FOMO Trader',
    icon: 'FMO',
    color: '#fef08a',
    textColor: 'text-amber-800',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    badgeBg: 'bg-amber-100 text-amber-900',
    shadowColor: '#fbbf24',
    headerBg: '#fef08a',
    description: 'You track trends, trade fast, and try to capture massive breakouts before they end.',
    specialMove: 'Trend Rider',
    specialMoveDesc: 'Instantly hops onto rising social signals, riding momentum waves before they peak.',
    stats: [
      { label: 'Risk Appetite', value: 80, barColor: '#fd56a7' },
      { label: 'FOMO Reflex', value: 90, barColor: '#fbbf24' },
      { label: 'HODL Strength', value: 40, barColor: '#7c3aed' },
      { label: 'Safety Net', value: 30, barColor: '#00d09c' }
    ],
    strengths: ['Catches Rallies', 'Fast Captures', 'Active Pulse'],
    weaknesses: ['Buys Tops', 'Panic Sells'],
    voiceQuote: "OMG, Zomato is breaking out! Buy the top, sell the bottom... wait, no, the other way! Quick, ride the hype train!"
  },
  'Thrill Chaser': {
    name: 'The Thrill Chaser',
    icon: 'THR',
    color: '#fecdd3',
    textColor: 'text-rose-800',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-300',
    badgeBg: 'bg-rose-100 text-rose-900',
    shadowColor: '#fb7185',
    headerBg: '#fecdd3',
    description: 'Momentum, volatile smallcaps, and high alpha projects. You live in the green lane.',
    specialMove: 'Alpha Sniper',
    specialMoveDesc: 'Targets microcaps under high momentum, aiming for 10x multipliers and high velocity wins.',
    stats: [
      { label: 'Risk Appetite', value: 100, barColor: '#fd56a7' },
      { label: 'FOMO Reflex', value: 95, barColor: '#fbbf24' },
      { label: 'HODL Strength', value: 25, barColor: '#7c3aed' },
      { label: 'Safety Net', value: 10, barColor: '#00d09c' }
    ],
    strengths: ['10x Capture Potential', 'First Mover', 'High Adrenaline'],
    weaknesses: ['High Drawdowns', 'High Risk Exposure'],
    voiceQuote: "Full degen mode activated! Stop loss? Never heard of her. We're riding this rocket to the moon or straight into the ground. YOLO!"
  }
}

export function Profile() {
  const { 
    user,
    riskArchetype, 
    vibeSelections, 
    startingCapital, 
    theme, 
    setTheme, 
    language, 
    setLanguage, 
    voiceStyle, 
    setVoiceStyle,
    setActivePage,
    holdings,
    vibeScore,
    vibeTier,
    xpHistory,
    discoveredCardsCount,
    cards,
    fetchCollection
  } = useVibeStore()

  useEffect(() => {
    fetchCollection()
  }, [])

  const [previewArchetype, setPreviewArchetype] = useState(riskArchetype)
  const [isPlayingVoice, setIsPlayingVoice] = useState(false)
  const [speechBubbleText, setSpeechBubbleText] = useState('')

  const displayName = user?.user_metadata?.full_name || 
    (user?.email 
      ? user.email.split('@')[0].split(/[._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      : 'Investor')

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [updatingName, setUpdatingName] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [updateError, setUpdateError] = useState(null)

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setNewName(user.user_metadata.full_name)
    } else if (user?.email) {
      setNewName(displayName)
    }
  }, [user, displayName])

  const handleUpdateName = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setUpdatingName(true)
    setUpdateSuccess(false)
    setUpdateError(null)
    try {
      if (user?.id !== 'default_user') {
        const { error } = await supabase.auth.updateUser({
          data: { full_name: newName }
        })
        if (error) throw error
      }
      setUpdateSuccess(true)
      
      // Update local storage cached profile
      const localProfileStr = localStorage.getItem(`vibeup_profile_${user.id}`)
      const localProfile = localProfileStr ? JSON.parse(localProfileStr) : {}
      localStorage.setItem(`vibeup_profile_${user.id}`, JSON.stringify({
        ...localProfile,
        displayName: newName
      }))
      
      // Update store user state
      useVibeStore.setState({ 
        user: { 
          ...user, 
          user_metadata: { 
            ...(user.user_metadata || {}), 
            full_name: newName 
          } 
        } 
      })
    } catch (err) {
      setUpdateError(err.message || 'Failed to update profile name')
    } finally {
      setUpdatingName(false)
    }
  }

  useEffect(() => {
    setPreviewArchetype(riskArchetype)
  }, [riskArchetype])

  const handleRetakeOnboarding = () => {
    if (confirm('Retake onboarding survey to redefine your risk settings?')) {
      setActivePage('onboarding')
    }
  }

  const handleTestVoice = () => {
    setIsPlayingVoice(true)
    const activeDetails = ARCHETYPE_DETAILS[previewArchetype]
    let intro = ''
    if (voiceStyle === 'calm') {
      intro = 'Co-pilot (Calm Rachel): "Take a deep breath, bestie. '
    } else if (voiceStyle === 'energetic') {
      intro = "Co-pilot (Energetic Adam): \"Yo! Let's get this bread! "
    } else {
      intro = 'Co-pilot (Robo-Copilot): "SYSTEM ONLINE. SCANNING MARKETS. '
    }
    setSpeechBubbleText(`${intro}${activeDetails.voiceQuote}"`)
    setTimeout(() => { setIsPlayingVoice(false) }, 4500)
  }

  const activeDetails = ARCHETYPE_DETAILS[previewArchetype] || ARCHETYPE_DETAILS['Optimizer']
  const userActualDetails = ARCHETYPE_DETAILS[riskArchetype] || ARCHETYPE_DETAILS['Optimizer']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-5xl mx-auto px-4 pt-6 pb-32 text-left relative"
    >
      {/* Subtle gradient ribbon background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{
          background: 'linear-gradient(135deg, rgba(253,86,167,0.08) 0%, rgba(124,58,237,0.08) 50%, rgba(255,219,202,0.08) 100%)'
        }}
      />
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-10" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ribbon-grad-profile" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#fd56a7" />
            <stop offset="50%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#ffb690" />
          </linearGradient>
        </defs>
        <path d="M-100 200 C 300 0, 500 400, 1000 200 S 1500 0, 2000 200" fill="none" stroke="url(#ribbon-grad-profile)" strokeLinecap="round" strokeWidth="40" />
        <path d="M-100 800 C 400 900, 600 500, 1200 700 S 1800 900, 2200 600" fill="none" stroke="url(#ribbon-grad-profile)" strokeLinecap="round" strokeWidth="60" />
      </svg>

      {/* Header */}
      <header className="mb-10 relative z-20 flex justify-between items-start select-none">
        <div className="relative inline-block">
          {/* Decorative star */}
          <svg className="absolute -top-5 -left-7 z-0 opacity-80" fill="none" height="36" viewBox="0 0 40 40" width="36">
            <path d="M20 0L23.5 16.5L40 20L23.5 23.5L20 40L16.5 23.5L0 20L16.5 16.5L20 0Z" fill="#fde047" stroke="#1c1b1b" strokeWidth="2" />
          </svg>
          <h1 className="font-display text-[40px] md:text-[64px] mb-2 text-[#1c1b1b] tracking-tighter drop-shadow-[3px_3px_0px_#fd56a7] leading-none uppercase relative z-10">
            User Control
          </h1>
          <p className="font-sans text-xs font-bold text-zinc-600 bg-white px-4 py-2 border-2 border-black rounded-lg inline-block transform rotate-1 mt-2 shadow-[2px_2px_0px_#1c1b1b]">
            Review your trading cards, track performance vibe ratings, and tune your co-pilot configurations.
          </p>
        </div>

        {/* Profile Avatar / Settings Dropdown in Top Right */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#fde047] border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_#1c1b1b] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none cursor-pointer transition-all overflow-hidden font-display text-lg font-black text-black uppercase"
            title="Profile Settings"
          >
            {user?.email ? user.email.slice(0, 2).toUpperCase() : 'ME'}
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 mt-3 w-80 bg-white border-4 border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_#1c1b1b] z-50 text-left"
              >
                <div className="flex items-center gap-3 border-b-3 border-black pb-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#fd56a7] border-3 border-black flex items-center justify-center font-display text-sm font-black text-white">
                    {user?.email ? user.email.slice(0, 2).toUpperCase() : 'ME'}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-headline text-sm font-black text-black leading-tight truncate">
                      {displayName}
                    </h4>
                    <span className="font-mono text-[9px] text-zinc-500 block truncate" title={user?.email}>
                      {user?.email}
                    </span>
                  </div>
                </div>

                {/* Edit Name Form */}
                <form onSubmit={handleUpdateName} className="space-y-4 mb-5">
                  <div className="space-y-1">
                    <label className="block font-mono text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                      Edit Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-[#fcf9f8] border-2 border-black rounded-lg px-3 py-2 font-headline text-xs focus:outline-none focus:bg-white"
                    />
                  </div>
                  {updateSuccess && (
                    <span className="text-[9px] font-black text-emerald-600 block">
                      ✓ Profile name updated successfully!
                    </span>
                  )}
                  {updateError && (
                    <span className="text-[9px] font-black text-rose-600 block">
                      ⚠ {updateError}
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={updatingName}
                    className="w-full py-2 bg-[#7c3aed] text-white border-2 border-black rounded-xl text-[10px] font-black shadow-[2px_2px_0px_#1c1b1b] hover:bg-purple-700 active:translate-y-0.5 active:shadow-none cursor-pointer uppercase flex justify-center items-center gap-1.5"
                  >
                    {updatingName ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>

                {/* Log Out Action */}
                <div className="border-t-2 border-dashed border-zinc-200 pt-4">
                  <button
                    onClick={() => supabase.auth.signOut()}
                    className="w-full py-2 bg-[#fd56a7] text-white border-2 border-black rounded-xl text-[10px] font-black shadow-[2px_2px_0px_#1c1b1b] hover:bg-rose-500 active:translate-y-0.5 active:shadow-none cursor-pointer uppercase"
                  >
                    Log Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 items-start">

        {/* LEFT COLUMN: Archetype Explorer */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* Archetype Selector — horizontal pill tabs (Stitch style) */}
          <div
            className="bg-white border-4 border-black rounded-[2rem] p-5 shadow-[6px_6px_0px_#1c1b1b] -rotate-[0.5deg] relative"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="font-mono text-[10px] font-black text-zinc-500 uppercase tracking-widest">Archetype Explorer</span>
              <span className="font-mono text-[8px] bg-[#fde047] border-2 border-black px-2 py-0.5 rounded-full font-black shadow-[1px_1px_0px_#1c1b1b]">Select to Preview</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pt-4 pb-2 px-2 -mx-2 no-scrollbar">
              {Object.keys(ARCHETYPE_DETAILS).map((arch) => {
                const isSelected = previewArchetype === arch
                const isActual = riskArchetype === arch
                return (
                  <button
                    key={arch}
                    onClick={() => {
                      setPreviewArchetype(arch)
                      setIsPlayingVoice(false)
                    }}
                    className={`
                      relative px-4 py-2 border-2 border-black rounded-full text-[11px] font-black whitespace-nowrap transition-all cursor-pointer shrink-0
                      ${isSelected
                        ? 'bg-black text-white shadow-[2px_2px_0px_#1c1b1b] scale-105'
                        : 'bg-white text-black hover:bg-zinc-100 shadow-[2px_2px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none'
                      }
                    `}
                  >
                    <span className={`font-mono text-[9px] mr-1.5 px-1 py-0.5 rounded ${isSelected ? 'bg-white/20' : 'bg-zinc-100 text-zinc-600'}`}>{ARCHETYPE_DETAILS[arch].icon}</span>
                    {arch}
                    {isActual && (
                      <span className="absolute -top-2 -right-1 text-[7px] bg-[#630ed4] text-white border-2 border-black rounded-full px-1.5 py-0.5 font-mono shadow-[1px_1px_0px_#1c1b1b]">
                        Me
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Personality Trading Card — Stitch-inspired with large display type, tilt, bg deco */}
          <AnimatePresence mode="wait">
            <motion.div
              key={previewArchetype}
              initial={{ opacity: 0, scale: 0.95, rotate: -0.5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.95, rotate: 0.5 }}
              transition={{ duration: 0.25 }}
              className="bg-white border-4 border-black rounded-[2rem] overflow-hidden shadow-[8px_8px_0px_#1c1b1b] rotate-[0.5deg] relative"
            >
              {/* Pro Badge (floating) */}
              <div className="absolute -right-3 -top-3 bg-[#7c3aed] text-white font-mono text-[9px] font-black py-1 px-3 rounded-full border-2 border-black rotate-12 z-20 shadow-[2px_2px_0px_#1c1b1b]">
                Pro
              </div>

              {/* Card Header — Archetype Color Block with large type */}
              <div
                className="p-6 border-b-4 border-black relative overflow-hidden"
                style={{ backgroundColor: activeDetails.headerBg }}
              >
                {/* Decorative bg icon (Stitch opacity-20 deco) */}
                <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none select-none">
                  <span className="font-display font-black text-[120px] text-black leading-none uppercase">
                    {activeDetails.icon}
                  </span>
                </div>

                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div>
                    <div className="w-12 h-12 bg-black/10 border-2 border-black/20 rounded-full flex items-center justify-center font-mono font-black text-sm text-black/80 mb-3">
                      {activeDetails.icon}
                    </div>
                    <h2 className="font-display text-[40px] md:text-[48px] leading-none uppercase tracking-tighter text-black font-black">
                      {activeDetails.name.replace('The ', '')}
                    </h2>
                    <span className="font-mono text-[10px] text-black/60 uppercase tracking-wider mt-1 block">
                      Vibe Personality Type
                    </span>
                  </div>
                  {previewArchetype === riskArchetype && (
                    <span className="bg-white text-black text-[9px] font-black border-2 border-black px-3 py-1 rounded-full uppercase tracking-wider shadow-[2px_2px_0px_#1c1b1b] rotate-[3deg] mt-4 shrink-0">
                      Your Match
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-5">
                {/* Description with left-border accent (Stitch style) */}
                <p className="text-sm text-zinc-700 leading-relaxed font-bold border-l-4 border-black pl-4 bg-zinc-50 py-2 pr-2 rounded-r-lg">
                  {activeDetails.description}
                </p>

                {/* Vibe Stats (dashed container, Stitch style) */}
                <div className="border-2 border-dashed border-black rounded-[1.5rem] p-5 bg-[#fcf9f8]">
                  <h4 className="font-mono text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Vibe Stats</h4>
                  <div className="space-y-4">
                    {activeDetails.stats.map((stat, sIdx) => (
                      <div key={sIdx} className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-black text-black">
                          <span>{stat.label}</span>
                          <span className="font-mono">{stat.value}%</span>
                        </div>
                        <div className="w-full bg-white border-2 border-black h-4 rounded-full overflow-hidden p-0.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stat.value}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full rounded-full border-r-2 border-black"
                            style={{ backgroundColor: stat.barColor }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider font-mono block">Strengths (W)</span>
                    <div className="flex flex-wrap gap-1">
                      {activeDetails.strengths.map((str) => (
                        <span key={str} className="text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md">
                          + {str}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider font-mono block">Flaws (L)</span>
                    <div className="flex flex-wrap gap-1">
                      {activeDetails.weaknesses.map((weak) => (
                        <span key={weak} className="text-[9px] font-bold bg-rose-50 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-md">
                          - {weak}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Signature Move */}
                <div className={`border-3 border-black rounded-2xl p-4 shadow-[3px_3px_0px_#1c1b1b] ${activeDetails.bgColor}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="text-zinc-800" size={14} />
                    <span className="text-xs font-black font-headline uppercase text-zinc-800">
                      Signature Move: {activeDetails.specialMove}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-700 leading-relaxed font-semibold">
                    {activeDetails.specialMoveDesc}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 pb-6 bg-zinc-50 border-t-3 border-black pt-4 flex justify-between items-center gap-4">
                <span className="text-[9px] font-extrabold text-zinc-500 font-mono uppercase">Survey Actions</span>
                <button
                  onClick={handleRetakeOnboarding}
                  className="px-4 py-2 bg-[#fd56a7] text-white border-2 border-black rounded-xl text-[10px] font-black shadow-[2px_2px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none hover:bg-rose-500 cursor-pointer flex items-center gap-1.5 uppercase"
                >
                  <RotateCcw size={10} className="stroke-[3]" />
                  <span>Retake Quiz</span>
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* DECORATIVE PIPE CONNECTOR (Stitch design element) */}
        <div className="hidden lg:flex lg:col-span-1 justify-center relative">
          <div className="w-10 h-full relative">
            <div className="absolute top-16 left-1/2 -translate-x-1/2 w-3 h-[calc(100%-4rem)] border-l-4 border-r-4 border-black bg-zinc-100 rounded-full flex flex-col justify-around py-16">
              <div className="w-7 h-7 rounded-full border-4 border-black bg-[#eaddff] -ml-2 flex items-center justify-center">
                <div className="w-2 h-2 bg-black rounded-full" />
              </div>
              <div className="w-7 h-7 rounded-full border-4 border-black bg-[#fd56a7] -ml-2 flex items-center justify-center">
                <div className="w-2 h-2 bg-black rounded-full" />
              </div>
              <div className="w-7 h-7 rounded-full border-4 border-black bg-[#fde047] -ml-2 flex items-center justify-center">
                <div className="w-2 h-2 bg-black rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Settings & Configs */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Vibe Stats & Config Card */}
          <div className="bg-white border-4 border-black rounded-[2rem] p-6 shadow-[6px_6px_0px_#1c1b1b] rotate-[0.5deg]">
            <div className="flex items-center gap-3 border-b-4 border-dashed border-black pb-4 mb-6">
              <Activity className="text-[#7c3aed]" size={22} />
              <h3 className="font-display text-[22px] uppercase tracking-tighter text-black leading-none">
                Vibe Stats &amp; Configs
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              {/* Monthly Capital */}
              <div className="border-2 border-black rounded-xl p-4 bg-[#fcf9f8] hover:bg-zinc-50 transition-colors shadow-[2px_2px_0px_#1c1b1b]">
                <span className="font-mono text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Monthly Capital Pool</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold font-mono">₹</span>
                  <input
                    type="number"
                    value={startingCapital}
                    onChange={(e) => useVibeStore.setState({ startingCapital: parseInt(e.target.value) || 0 })}
                    className="w-full bg-transparent border-b-2 border-black font-mono text-xl font-black text-black focus:outline-none p-0"
                  />
                </div>
              </div>

              {/* Account Status */}
              <div className="border-2 border-black rounded-xl p-4 bg-[#fcf9f8] hover:bg-zinc-50 transition-colors shadow-[2px_2px_0px_#1c1b1b]">
                <span className="font-mono text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Account Status</span>
                <span className="font-headline text-sm font-black text-black block">Verified Paper Trader</span>
              </div>



              {/* Holdings & Archetype side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border-2 border-black rounded-xl p-4 bg-[#eaddff] shadow-[2px_2px_0px_#1c1b1b]">
                  <span className="font-mono text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Holdings</span>
                  <span className="text-2xl font-mono font-black text-[#630ed4] block">{holdings.length}</span>
                </div>
                <div className="border-2 border-black rounded-xl p-4 bg-[#d1fae5] shadow-[2px_2px_0px_#1c1b1b]">
                  <span className="font-mono text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Archetype</span>
                  <span className="text-xs font-black text-emerald-800 block uppercase leading-tight mt-1">{riskArchetype}</span>
                </div>
              </div>

              {/* Vibe Filters */}
              {vibeSelections.length > 0 && (
                <div className="pt-2 border-t-2 border-dashed border-zinc-200">
                  <span className="font-mono text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Active Vibe Filters</span>
                  <div className="flex flex-wrap gap-1.5">
                    {vibeSelections.map((v) => (
                      <span key={v} className="text-[9px] font-bold bg-[#ffdbca] text-[#341100] border-2 border-black px-2 py-0.5 rounded-full shadow-[1.5px_1.5px_0px_#1c1b1b]">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {vibeSelections.length === 0 && (
                <p className="text-[9px] font-semibold text-zinc-400 pt-1">No vibes configured. Retake quiz to add.</p>
              )}
            </div>
          </div>

          {/* Voice Co-Pilot Soundboard */}
          <div className="bg-white border-4 border-black rounded-[2rem] p-6 shadow-[6px_6px_0px_#1c1b1b] -rotate-[0.5deg]">
            <div className="flex items-center justify-between border-b-4 border-dashed border-black pb-4 mb-6">
              <div className="flex items-center gap-3">
                <Volume2 className="text-[#fd56a7]" size={22} />
                <h3 className="font-display text-[22px] uppercase tracking-tighter text-black leading-none">
                  Voice Co-Pilot<br />Soundboard
                </h3>
              </div>
              <button
                onClick={handleTestVoice}
                disabled={isPlayingVoice}
                className={`
                  px-3 py-2 border-2 border-black rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0
                  ${isPlayingVoice
                    ? 'bg-zinc-100 text-zinc-400 shadow-none scale-95 border-dashed'
                    : 'bg-white text-black hover:bg-zinc-50 shadow-[2px_2px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none'
                  }
                `}
              >
                <Play size={10} className={isPlayingVoice ? 'text-zinc-400' : 'text-black fill-black'} />
                <span>Test</span>
              </button>
            </div>

            <div className="flex flex-col gap-4 font-headline font-bold text-[10px] mb-4">
              {/* Language select */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">Co-Pilot Language</label>
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full appearance-none bg-[#fcf9f8] border-4 border-black rounded-xl py-3 px-4 text-sm font-black text-black focus:outline-none focus:border-[#630ed4] shadow-[3px_3px_0px_#1c1b1b] hover:bg-zinc-50 cursor-pointer"
                  >
                    <option value="en-IN">English (India) IN</option>
                    <option value="hi-IN">Hindi (हिन्दी) IN</option>
                    <option value="ta-IN">Tamil (தமிழ்) IN</option>
                    <option value="te-IN">Telugu (తెలుగు) IN</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black font-black text-xs">▾</span>
                </div>
              </div>

              {/* Voice style select */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">ElevenLabs Voice Style</label>
                <div className="relative">
                  <select
                    value={voiceStyle}
                    onChange={(e) => setVoiceStyle(e.target.value)}
                    className="w-full appearance-none bg-[#fcf9f8] border-4 border-black rounded-xl py-3 px-4 text-sm font-black text-black focus:outline-none focus:border-[#fd56a7] shadow-[3px_3px_0px_#1c1b1b] hover:bg-zinc-50 cursor-pointer"
                  >
                    <option value="calm">Calm (Rachel)</option>
                    <option value="energetic">Energetic (Adam)</option>
                    <option value="robotic">Cybernetic (Robo)</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black font-black text-xs">▾</span>
                </div>
              </div>
            </div>

            {/* Speech bubble simulator */}
            <AnimatePresence>
              {speechBubbleText && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-black text-white p-4 rounded-2xl relative border-2 border-black font-mono text-[10px] shadow-[4px_4px_0px_#630ed4] text-left leading-relaxed"
                >
                  <div className="absolute -top-2 left-6 w-4 h-4 bg-black rotate-45 border-t border-l border-black" />
                  <p>{speechBubbleText}</p>
                  {isPlayingVoice && (
                    <div className="flex items-center gap-1 mt-3 justify-center">
                      {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                        <motion.div
                          key={bar}
                          animate={{ height: [6, 18, 6] }}
                          transition={{ duration: 0.7, repeat: Infinity, delay: bar * 0.1, ease: 'easeInOut' }}
                          className="w-1 bg-[#fd56a7] rounded-full"
                          style={{ minHeight: '6px' }}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Visual Settings */}
          <div className="bg-white border-4 border-black rounded-[2rem] p-6 shadow-[6px_6px_0px_#1c1b1b] rotate-[0.5deg]">
            <div className="flex items-center gap-3 border-b-4 border-dashed border-black pb-4 mb-6">
              <Moon className="text-[#fbbf24]" size={22} />
              <h3 className="font-display text-[22px] uppercase tracking-tighter text-black leading-none">
                Visual Settings
              </h3>
            </div>

            <div className="space-y-3">
              <label className="font-mono text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">Interface Theme</label>
              <div className="flex flex-col gap-3">
                {[
                  { key: 'Dark', bg: 'bg-[#eaddff]', text: 'text-[#25005a]' },
                  { key: 'Darker', bg: 'bg-[#fcf9f8]', text: 'text-black' },
                  { key: 'Pure Black OLED', bg: 'bg-[#1c1b1b]', text: 'text-white' }
                ].map(({ key, bg, text }) => {
                  const isActive = theme === key
                  return (
                    <button
                      key={key}
                      onClick={() => setTheme(key)}
                      className={`
                        w-full py-3 px-4 text-left border-4 border-black rounded-xl text-sm font-black cursor-pointer transition-all
                        ${isActive
                          ? `${bg} ${text} shadow-[4px_4px_0px_#1c1b1b] scale-[1.02]`
                          : 'bg-[#fcf9f8] text-zinc-500 hover:text-black hover:bg-zinc-50 shadow-[2px_2px_0px_#1c1b1b]'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span>{key}</span>
                        {isActive && <Check size={14} className="stroke-[3]" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* === VIBESCORE SECTION === */}
      <div className="relative z-10 mt-10 space-y-8">

        {/* VibeScore Card */}
        <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_#7c3aed] relative overflow-hidden">
          {/* Rainbow stripe accent */}
          <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-[#fd56a7] via-[#7c3aed] to-[#fde047]" />
          
          <div className="flex flex-col md:flex-row gap-8 items-start mt-2">
            <div className="flex-1 text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Your XP</span>
              <h2 className="font-display text-5xl md:text-6xl font-black text-[#1c1b1b] mt-1 leading-none">
                {vibeScore}<span className="text-xl text-zinc-400 ml-1.5 font-mono font-bold"> XP</span>
              </h2>
              
              <div className="mt-4 inline-flex items-center gap-2 bg-[#7c3aed] text-white border-2 border-black px-4 py-1.5 rounded-full shadow-[2.5px_2.5px_0px_#1c1b1b] font-bold select-none">
                <Zap size={13} className="text-[#fde047] fill-[#fde047]" />
                <span className="text-[11px] font-black uppercase tracking-wider">{vibeTier}</span>
              </div>
 
              {/* XP Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-[10px] font-black text-zinc-500 mb-1.5 uppercase font-mono">
                  <span>XP Progress</span>
                  <span className="text-black font-black">{vibeScore % 100}/100 XP</span>
                </div>
                <div className="w-full h-4 bg-zinc-100 border-2 border-black rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-[#7c3aed] to-[#fd56a7] transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, vibeScore % 100)}%` }}
                  />
                </div>
              </div>
            </div>
 
            {/* Recent XP History */}
            <div className="w-full md:w-72 space-y-3 bg-zinc-50/50 border-2 border-dashed border-zinc-200 p-4 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono block">Recent XP Events</span>
              <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar pr-1">
                {xpHistory && xpHistory.slice(0, 6).map((ev, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white border-2 border-black rounded-xl px-3 py-2 shadow-[2px_2px_0px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all">
                    <span className="text-[10px] font-extrabold text-zinc-700 truncate max-w-[150px] capitalize">{ev.event_type?.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] font-black text-[#7c3aed] font-mono shrink-0">+{ev.xp_amount} XP</span>
                  </div>
                ))}
                {(!xpHistory || xpHistory.length === 0) && (
                  <p className="text-[10px] font-bold text-zinc-455 font-mono italic text-center py-4">No XP events yet. Start exploring!</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Trading Cards Mini Grid */}
        <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_#1c1b1b]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono block">Card Collection</span>
              <h3 className="font-display text-2xl font-black text-black uppercase mt-0.5">
                {discoveredCardsCount}<span className="text-zinc-400">/50</span> Cards
              </h3>
            </div>
            <button
              onClick={() => setActivePage('cards')}
              className="flex items-center gap-1.5 py-2 px-4 border-3 border-black rounded-xl bg-[#fde047] text-black font-black text-xs uppercase shadow-[3px_3px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              <span>View All</span>
              <span>🎴</span>
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3.5 bg-zinc-100 rounded-full border-2 border-black overflow-hidden mb-5">
            <div 
              className="h-full bg-gradient-to-r from-[#00d09c] via-[#7c3aed] to-[#fd56a7] transition-all duration-500"
              style={{ width: `${(discoveredCardsCount / 50) * 100}%` }}
            />
          </div>

          {/* Mini grid of 5 recent collected cards */}
          <div className="grid grid-cols-5 gap-3">
            {cards
              .filter(c => c.is_collected)
              .slice(0, 5)
              .map((c) => {
                const hexOpacity = `${c.sector_color}26`
                const rarityColors = {
                  Common: 'bg-zinc-100 text-zinc-700',
                  Rare: 'bg-blue-50 text-blue-700',
                  Epic: 'bg-purple-50 text-purple-700',
                  Legendary: 'bg-gradient-to-r from-red-500 to-yellow-500 text-white'
                }
                return (
                  <div
                    key={c.ticker}
                    onClick={() => setActivePage('cards')}
                    className="border-[2.5px] border-black rounded-2xl p-2.5 flex flex-col items-center justify-center text-center cursor-pointer hover:-translate-y-1 transition-all shadow-[3px_3px_0px_#1c1b1b] hover:shadow-[4px_4px_0px_#1c1b1b]"
                    style={{ backgroundColor: hexOpacity }}
                  >
                    <span className="font-display font-black text-xs text-black leading-none">{c.ticker}</span>
                    <span className={`text-[7px] font-black uppercase mt-1.5 px-1 py-0.5 rounded border border-black/20 ${rarityColors[c.rarity] || rarityColors.Common}`}>{c.rarity}</span>
                  </div>
                )
              })
            }
            {/* Fill remaining slots with locked placeholders */}
            {Array.from({ length: Math.max(0, 5 - cards.filter(c => c.is_collected).slice(0, 5).length) }).map((_, i) => (
              <div key={`locked-${i}`} className="border-[2.5px] border-black/30 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center bg-zinc-50 opacity-50">
                <Lock size={14} className="text-zinc-400" />
                <span className="text-[7px] font-bold text-zinc-400 mt-1">???</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vibe Wrapped CTA */}
        <div 
          onClick={() => setActivePage('wrapped')}
          className="bg-[#fd56a7] border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_#1c1b1b] cursor-pointer hover:-translate-y-1 hover:shadow-[10px_10px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-[4px_4px_0px_#1c1b1b] transition-all relative overflow-hidden group"
        >
          {/* Decorative wave */}
          <div className="absolute inset-x-0 bottom-0 opacity-20 pointer-events-none">
            <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-10">
              <path d="M0,10 Q25,20 50,10 T100,10" fill="#1c1b1b" />
            </svg>
          </div>

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70 font-mono">Your Financial Story</span>
              <h3 className="font-display text-3xl md:text-4xl font-black text-white uppercase mt-1 leading-tight drop-shadow-[2px_2px_0px_#1c1b1b]">
                GENERATE VIBE WRAPPED
              </h3>
              <p className="text-white/80 text-xs font-bold mt-2 max-w-xs">
                Monthly AI-generated highlights of your portfolio wins, losses, and behavior patterns.
              </p>
            </div>
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white border-4 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_#1c1b1b] transform rotate-[-6deg] group-hover:rotate-0 transition-transform shrink-0">
              <Gift size={32} className="text-[#fd56a7]" />
            </div>
          </div>
        </div>

      </div>

      {/* Floating decorative blob (Stitch design element) */}
      <div className="fixed bottom-10 right-10 pointer-events-none z-50 opacity-70 mix-blend-multiply hidden lg:block">
        <svg fill="none" height="110" viewBox="0 0 100 100" width="110">
          <path d="M50 10 C 20 10, 10 40, 10 60 C 10 80, 40 90, 60 80 C 80 70, 90 40, 70 20 Z" fill="#ffd9e4" stroke="#1c1b1b" strokeWidth="4" />
          <circle cx="35" cy="45" fill="#1c1b1b" r="5" />
          <circle cx="65" cy="45" fill="#1c1b1b" r="5" />
          <path d="M40 65 Q 50 75 60 65" stroke="#1c1b1b" strokeLinecap="round" strokeWidth="4" />
        </svg>
      </div>
    </motion.div>
  )
}

export default Profile
