import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ArrowRight, ShieldCheck, Info } from 'lucide-react'
import { AreaChart, Area, XAxis, ResponsiveContainer } from 'recharts'
import { useVibeStore } from '../store/vibeStore'

const VIBE_OPTIONS = [
  { id: 'india-glow', emoji: '🚀', label: "Bet on India's glow-up", sublabel: 'Infra, manufacturing, capex themes', bgClass: 'bg-[#ffb690] hover:bg-yellow-200' },
  { id: 'ai-everything', emoji: '🤖', label: "AI is eating everything", sublabel: 'IT, semiconductors, global tech ETFs', bgClass: 'bg-[#7dd3fc] hover:bg-yellow-200' },
  { id: 'boring-wealth', emoji: '🏦', label: "Boring money that compounds", sublabel: 'Nifty 50 SIP, large caps, index funds', bgClass: 'bg-[#faf7f2] hover:bg-yellow-200' },
  { id: 'high-risk', emoji: '⚡', label: "High risk, high reward", sublabel: 'Smallcaps, momentum, F&O adjacent', bgClass: 'bg-[#fd56a7] hover:bg-yellow-200' },
  { id: 'global-diversify', emoji: '🌍', label: "Global diversification", sublabel: 'US ETFs, gold, international funds', bgClass: 'bg-[#eaddff] hover:bg-yellow-200' },
]

const RISK_OPTIONS = [
  { id: 'buy-more', label: "I buy more. This is a sale. 📈", tag: 'Optimizer', archetype: 'Optimizer', bgClass: 'bg-[#ffb690] hover:bg-yellow-200' },
  { id: 'hold-on', label: "I hold and don't look. 🙈", tag: 'Slow Builder', archetype: 'Slow Builder', bgClass: 'bg-[#faf7f2] hover:bg-yellow-200' },
  { id: 'panic-no-sell', label: "I panic but don't sell. 😰", tag: 'FOMO Trader', archetype: 'FOMO Trader', bgClass: 'bg-[#fde047] hover:bg-yellow-200' },
  { id: 'sell-immediate', label: "I sell immediately. 📉", tag: 'Thrill Chaser', archetype: 'Thrill Chaser', bgClass: 'bg-[#fd56a7] hover:bg-yellow-200' },
]

const TIMELINE_OPTIONS = [
  { id: 'day-trade', label: "Tomorrow morning. I want quick action! ⚡", tag: 'Thrill Chaser', archetype: 'Thrill Chaser', bgClass: 'bg-[#ffb690] hover:bg-yellow-200' },
  { id: 'swing-trade', label: "Next season. A few weeks/months. 🛹", tag: 'FOMO Trader', archetype: 'FOMO Trader', bgClass: 'bg-[#eaddff] hover:bg-yellow-200' },
  { id: 'medium-term', label: "When I buy a house or car. 🏡", tag: 'Optimizer', archetype: 'Optimizer', bgClass: 'bg-[#7dd3fc] hover:bg-yellow-200' },
  { id: 'long-term', label: "Retirement or legacy wealth. HODL! 🧓", tag: 'Slow Builder', archetype: 'Slow Builder', bgClass: 'bg-[#faf7f2] hover:bg-yellow-200' },
]

const RECOMMENDATIONS = {
  'Slow Builder': [
    { ticker: 'RELIANCE', name: 'Reliance Industries', reason: 'Conglomerate backing India retail, telecom and green energy.', bg: 'bg-[#faf7f2]' },
    { ticker: 'HDFCBANK', name: 'HDFC Bank Ltd', reason: 'Private banking heavyweight trading at deep valuation discount.', bg: 'bg-[#faf7f2]' },
    { ticker: 'INFY', name: 'Infosys Ltd', reason: 'Tech giant with high dividend yields and steady cash flows.', bg: 'bg-[#faf7f2]' }
  ],
  'Optimizer': [
    { ticker: 'HAL', name: 'Hindustan Aeronautics', reason: 'Make-in-India defense compounder with stacked order book.', bg: 'bg-[#ffb690]' },
    { ticker: 'TATASTEEL', name: 'Tata Steel Ltd', reason: 'Profiting from capex expansion and massive metal demand.', bg: 'bg-[#ffb690]' },
    { ticker: 'LT', name: 'Larsen & Toubro', reason: 'Engineering bellwether executing major infrastructure projects.', bg: 'bg-[#ffb690]' }
  ],
  'FOMO Trader': [
    { ticker: 'ZOMATO', name: 'Zomato Limited', reason: 'Dominant food delivery and quick-commerce Blinkit expansion.', bg: 'bg-[#fde047]' },
    { ticker: 'TATAELXSI', name: 'Tata Elxsi', reason: 'High-growth design and tech services with strong AI exposure.', bg: 'bg-[#fde047]' },
    { ticker: 'JIOFIN', name: 'Jio Financial Services', reason: 'Retail flow momentum play in digital lending expansion.', bg: 'bg-[#fde047]' }
  ],
  'Thrill Chaser': [
    { ticker: 'SUZLON', name: 'Suzlon Energy', reason: 'High-beta wind energy turnaround story with heavy trading volume.', bg: 'bg-[#fd56a7]' },
    { ticker: 'IREDA', name: 'Indian Renewable Energy', reason: 'Renewable energy financing powerhouse with massive momentum.', bg: 'bg-[#fd56a7]' },
    { ticker: 'TRENT', name: 'Trent Ltd', reason: 'Retail fashion breakout leader with extremely premium valuations.', bg: 'bg-[#fd56a7]' }
  ]
}

export function Onboarding() {
  const { setOnboardingProfile, setActivePage, watchlist = [], toggleWatchlist } = useVibeStore()
  const [step, setStep] = useState(1)

  // Step 1 State: Vibes (multiselect)
  const [selectedVibes, setSelectedVibes] = useState([])

  // Step 2 State: Risk option
  const [selectedRisk, setSelectedRisk] = useState(null)

  // Step 3 State: Timeline option
  const [selectedTimeline, setSelectedTimeline] = useState(null)

  // Step 4 State: Capital slider
  const [capital, setCapital] = useState(5000)

  const toggleVibe = (label) => {
    if (selectedVibes.includes(label)) {
      setSelectedVibes(selectedVibes.filter(v => v !== label))
    } else {
      setSelectedVibes([...selectedVibes, label])
    }
  }

  // Compound Curve computations for Step 4
  const compoundData = useMemo(() => {
    const data = []
    let currentVal = 0
    for (let yr = 1; yr <= 20; yr++) {
      currentVal = (currentVal + capital * 12) * 1.12
      data.push({
        year: `Yr ${yr}`,
        value: Math.round(currentVal)
      })
    }
    return data
  }, [capital])

  // Weighted scoring engine to determine target archetype
  const targetArchetype = useMemo(() => {
    const scores = {
      'Slow Builder': 0,
      'Optimizer': 0,
      'FOMO Trader': 0,
      'Thrill Chaser': 0
    }
    if (selectedRisk) {
      scores[selectedRisk.archetype] += 2
    }
    if (selectedTimeline) {
      scores[selectedTimeline.archetype] += 2
    }

    let maxScore = -1
    let scoredArchetype = 'Optimizer'
    for (const [arch, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score
        scoredArchetype = arch
      }
    }
    return scoredArchetype
  }, [selectedRisk, selectedTimeline])

  const futureValue = compoundData[19]?.value || 0

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1)
      if (step === 4) {
        createConfetti()
      }
    } else {
      setOnboardingProfile(targetArchetype, selectedVibes, capital)
      setActivePage('warroom')
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const createConfetti = () => {
    const colors = ['#fd56a7', '#630ed4', '#aa4900', '#1c1b1b', '#ffdbca']
    for (let i = 0; i < 60; i++) {
      const conf = document.createElement('div')
      conf.style.position = 'fixed'
      conf.style.width = Math.random() * 12 + 8 + 'px'
      conf.style.height = conf.style.width
      conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      conf.style.left = Math.random() * 100 + 'vw'
      conf.style.top = '-20px'
      conf.style.opacity = Math.random() * 0.7 + 0.3
      conf.style.zIndex = '9999'
      conf.style.border = '2px solid #1c1b1b'
      if (Math.random() > 0.5) conf.style.borderRadius = '50%'

      document.body.appendChild(conf)

      const duration = Math.random() * 2 + 1.5
      conf.animate([
        { transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)', opacity: 1 },
        { transform: `translate3d(${Math.random() * 200 - 100}px, 110vh, 0) rotate(${Math.random() * 720}deg) scale(0.3)`, opacity: 0 }
      ], {
        duration: duration * 1000,
        easing: 'cubic-bezier(.1, .8, .3, 1)',
        fill: 'forwards'
      })

      setTimeout(() => conf.remove(), duration * 1000)
    }
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col font-sans bg-[#faf7f2] text-[#1c1b1b]">
      
      {/* SVG Filters for roughness */}
      <svg className="hidden">
        <defs>
          <filter id="roughness-subtle">
            <feTurbulence baseFrequency="0.05" numOctaves="2" result="noise" type="fractalNoise"></feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap>
          </filter>
        </defs>
      </svg>

      {/* Sweeping Rainbow Ribbons */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-50">
        <svg className="absolute w-[150vw] h-[150vh] top-[-10vh] left-[-20vw]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1000 1000">
          <path className="fill-none stroke-rainbow-1 stroke-[40px] opacity-80" d="M -100,700 C 300,520 600,800 1200,400" />
          <path className="fill-none stroke-rainbow-2 stroke-[40px] opacity-80" d="M -100,740 C 300,560 600,840 1200,440" />
          <path className="fill-none stroke-rainbow-3 stroke-[40px] opacity-80" d="M -100,780 C 300,600 600,880 1200,480" />
          <path className="fill-none stroke-rainbow-4 stroke-[40px] opacity-80" d="M -100,820 C 300,640 600,920 1200,520" />
          <path className="fill-none stroke-rainbow-5 stroke-[40px] opacity-80" d="M -100,860 C 300,680 600,960 1200,560" />
        </svg>
      </div>

      {/* Extra Doodles */}
      <div className="fixed inset-0 pointer-events-none z-10">
        <div className="absolute top-[20%] left-[10%] star-doodle opacity-70">
          <svg fill="none" height="30" viewBox="0 0 40 40" width="30" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 0L23.5 16.5L40 20L23.5 23.5L20 40L16.5 23.5L0 20L16.5 16.5L20 0Z" fill="#ffb690" stroke="#1c1b1b" strokeWidth="2"></path>
          </svg>
        </div>
        <div className="absolute top-[15%] right-[15%] star-doodle opacity-80" style={{ animationDelay: '1.2s' }}>
          <svg fill="none" height="40" viewBox="0 0 40 40" width="40" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 0L23.5 16.5L40 20L23.5 23.5L20 40L16.5 23.5L0 20L16.5 16.5L20 0Z" fill="#fde047" stroke="#1c1b1b" strokeWidth="2"></path>
          </svg>
        </div>
      </div>

      {/* Top Nav Header */}
      <header className="w-full flex justify-between items-center p-6 z-30 relative shrink-0">
        <div className="relative z-30 flex flex-col items-start">
          <h1 className="font-display text-4xl md:text-5xl text-[#ffffff] mb-2 tracking-tighter leading-none relative inline-block">
            <span className="absolute inset-0 text-[#b4136d] translate-x-1 translate-y-1 z-[-1]" style={{ textShadow: '-2px -2px 0 #1c1b1b, 2px -2px 0 #1c1b1b, -2px 2px 0 #1c1b1b, 2px 2px 0 #1c1b1b' }}>VibeUp</span>
            <span className="absolute inset-0 text-[#7c3aed] translate-x-1.5 translate-y-1.5 z-[-2]" style={{ textShadow: '-2px -2px 0 #1c1b1b, 2px -2px 0 #1c1b1b, -2px 2px 0 #1c1b1b, 2px 2px 0 #1c1b1b' }}>VibeUp</span>
            <span className="relative z-10" style={{ textShadow: '-2px -2px 0 #1c1b1b, 2px -2px 0 #1c1b1b, -2px 2px 0 #1c1b1b, 2px 2px 0 #1c1b1b' }}>VibeUp</span>
          </h1>
        </div>
        
        <div className="bg-white text-on-background px-6 py-2 rounded-full font-headline text-lg border-4 border-on-background shadow-[4px_4px_0px_#fd56a7] transform rotate-2">
          Step <span id="current-step-indicator">{step}</span> of 5
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex flex-col items-center justify-start md:justify-center p-4 py-8 md:p-12 w-full max-w-5xl mx-auto relative z-30 pb-28">
        
        {/* Mascot Peeking */}
        <div className="absolute -top-16 -left-4 md:-top-10 md:-left-20 z-40 animate-pulse">
          <div className="relative w-24 h-24 bg-[#fde047] rounded-full border-4 border-[#1c1b1b] shadow-[4px_4px_0px_0px_#1c1b1b] p-4 transform -rotate-12 flex items-center justify-center">
            <span className="text-4xl">👻</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Pick your vibe */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              <div className="bg-white border-4 border-[#1c1b1b] rounded-3xl p-8 md:p-12 shadow-[8px_8px_0px_0px_#fd56a7] transform rotate-1 mx-auto relative">
                <div className="relative mb-10 text-center">
                  <h1 className="font-display text-4xl md:text-6xl uppercase italic font-black relative inline-block text-on-background">
                    pick your vibe
                    <svg className="absolute -bottom-4 left-0 w-full h-6" preserveAspectRatio="none" viewBox="0 0 300 20">
                      <path d="M0,10 Q15,0 30,10 T60,10 T90,10 T120,10 T150,10 T180,10 T210,10 T240,10 T270,10 T300,10" fill="none" stroke="#630ed4" strokeWidth="6" style={{ filter: 'url(#roughness-subtle)' }}></path>
                    </svg>
                  </h1>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 relative z-20">
                  {VIBE_OPTIONS.map((opt) => {
                    const isSelected = selectedVibes.includes(opt.label)
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleVibe(opt.label)}
                        className={`
                          border-4 border-[#1c1b1b] p-6 rounded-2xl flex flex-col items-center justify-center gap-3 text-center
                          shadow-[6px_6px_0px_0px_#1c1b1b] active:translate-y-1.5 active:shadow-[0px_0px_0px_0px_#1c1b1b] transition-all cursor-pointer
                          ${opt.bgClass} ${isSelected ? 'ring-4 ring-[#630ed4] scale-105' : ''}
                        `}
                      >
                        <span className="text-4xl">{opt.emoji}</span>
                        <span className="font-headline text-lg font-bold">{opt.label}</span>
                        {isSelected && <span className="text-[10px] uppercase font-bold text-white bg-black px-2 py-0.5 rounded">Selected</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: React to market chaos */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl mx-auto"
            >
              <div className="bg-white border-4 border-[#1c1b1b] rounded-3xl p-8 md:p-12 shadow-[8px_8px_0px_0px_#fd56a7] transform rotate-1 relative">
                <h1 className="font-display text-3xl md:text-5xl mb-8 text-center font-black uppercase italic">how do you handle dips? 🎢</h1>
                
                <div className="flex flex-col gap-6 mb-4 relative z-20">
                  {RISK_OPTIONS.map((opt) => {
                    const isSelected = selectedRisk?.id === opt.id
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedRisk(opt)}
                        className={`
                          border-4 border-[#1c1b1b] p-6 rounded-2xl flex justify-between items-center w-full
                          shadow-[6px_6px_0px_0px_#1c1b1b] active:translate-y-1.5 active:shadow-[0px_0px_0px_0px_#1c1b1b] transition-all cursor-pointer text-left
                          ${opt.bgClass} ${isSelected ? 'ring-4 ring-[#630ed4] scale-[1.02]' : ''}
                        `}
                      >
                        <span className="font-display text-xl md:text-2xl font-bold">{opt.label}</span>
                        <span className="text-zinc-700 font-bold border-2 border-black px-4 py-1 rounded-full bg-white text-xs whitespace-nowrap">
                          {opt.tag}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Timeline horizon */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl mx-auto"
            >
              <div className="bg-white border-4 border-[#1c1b1b] rounded-3xl p-8 md:p-12 shadow-[8px_8px_0px_0px_#fd56a7] transform -rotate-1 relative">
                <h1 className="font-display text-3xl md:text-5xl mb-8 text-center font-black uppercase italic">when do you want this bag secured? ⏳</h1>
                
                <div className="flex flex-col gap-6 mb-4 relative z-20">
                  {TIMELINE_OPTIONS.map((opt) => {
                    const isSelected = selectedTimeline?.id === opt.id
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedTimeline(opt)}
                        className={`
                          border-4 border-[#1c1b1b] p-6 rounded-2xl flex justify-between items-center w-full
                          shadow-[6px_6px_0px_0px_#1c1b1b] active:translate-y-1.5 active:shadow-[0px_0px_0px_0px_#1c1b1b] transition-all cursor-pointer text-left
                          ${opt.bgClass} ${isSelected ? 'ring-4 ring-[#630ed4] scale-[1.02]' : ''}
                        `}
                      >
                        <span className="font-display text-xl md:text-2xl font-bold">{opt.label}</span>
                        <span className="text-zinc-700 font-bold border-2 border-black px-4 py-1 rounded-full bg-white text-xs whitespace-nowrap">
                          {opt.tag}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Capital Slider */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl mx-auto"
            >
              <div className="bg-white border-4 border-[#1c1b1b] rounded-3xl p-8 md:p-12 shadow-[8px_8px_0px_0px_#fd56a7] transform rotate-1 relative">
                <h1 className="font-display text-3xl md:text-5xl mb-8 text-center font-black uppercase italic">how much you dropping? 💸</h1>
                
                <div className="mb-8 flex flex-col gap-6 relative z-20">
                  <div className="text-center bg-[#f6f3f2] p-6 rounded-2xl border-4 border-on-background inline-block mx-auto transform rotate-2 shadow-[4px_4px_0px_#1c1b1b]">
                    <span className="font-display text-5xl md:text-7xl text-[#630ed4] font-black">₹{capital.toLocaleString('en-IN')}</span>
                    <p className="text-zinc-600 mt-2 font-display text-sm uppercase tracking-wider">per month</p>
                  </div>
                  
                  <div className="px-4 py-6">
                    <input
                      id="amountSlider"
                      min="500"
                      max="100000"
                      step="500"
                      value={capital}
                      onChange={(e) => setCapital(parseInt(e.target.value))}
                      type="range"
                      className="w-full h-4 bg-zinc-200 rounded-full border-4 border-black appearance-none cursor-pointer accent-[#fd56a7]"
                    />
                  </div>

                  <div className="bg-[#f6f3f2] p-4 rounded-xl border border-black flex gap-2.5 items-start mt-2">
                    <Info className="text-[#630ed4] shrink-0 mt-0.5" size={16} />
                    <div className="text-left text-xs font-bold text-zinc-700">
                      Invested Capital projected over 20 years compounding at 12% CAGR: <span className="text-black font-black">₹{futureValue.toLocaleString('en-IN')}</span>.
                    </div>
                  </div>

                  {/* Compounding Curve */}
                  <div className="h-32 bg-[#f6f3f2] border-4 border-[#1c1b1b] rounded-xl flex items-end relative overflow-hidden mt-4">
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-400 font-mono text-[10px] opacity-40">Dynamic Compounding Curve</div>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={compoundData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <Area type="monotone" dataKey="value" stroke="#fd56a7" strokeWidth={3} fill="#fd56a7" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Results */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl mx-auto text-center"
            >
              <div className="bg-white border-4 border-[#1c1b1b] rounded-3xl p-8 md:p-12 shadow-[8px_8px_0px_0px_#fd56a7] transform -rotate-1 relative">
                <div className="mb-4">
                  <span className="text-xs font-headline text-secondary uppercase tracking-widest bg-[#f6f3f2] inline-block px-6 py-2 rounded-full border-3 border-black transform rotate-2">
                    your vibe profile dropped 🎉
                  </span>
                </div>

                <h1 
                  className="font-display text-4xl md:text-7xl text-[#1c1b1b] mb-8 uppercase italic leading-none font-black"
                  style={{ textShadow: '4px 4px 0px #630ed4' }}
                >
                  ⚡ The {targetArchetype}
                </h1>

                <p className="font-headline text-lg mb-6 font-bold uppercase">Starter Picks for you:</p>
                
                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3 mb-10 relative z-20 text-left">
                  {RECOMMENDATIONS[targetArchetype].map((stock) => {
                    const isAdded = watchlist.includes(stock.ticker)
                    return (
                      <div 
                        key={stock.ticker}
                        className={`
                          border-3 border-black p-5 rounded-2xl flex flex-col justify-between gap-4
                          shadow-[4px_4px_0px_0px_#1c1b1b] transition-transform ${stock.bg}
                        `}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-headline text-xl font-extrabold text-black">{stock.ticker}</span>
                            <span className="text-[9px] bg-white border-2 border-black px-2 py-0.5 rounded-full font-bold uppercase">NSE</span>
                          </div>
                          <p className="text-xs font-bold text-zinc-800 mt-1">{stock.name}</p>
                          <p className="text-[10px] text-zinc-600 mt-3 font-medium leading-relaxed font-sans">{stock.reason}</p>
                        </div>
                        
                        <button
                          onClick={() => toggleWatchlist(stock.ticker)}
                          className={`
                            w-full py-2 border-2 border-black rounded-xl font-headline text-[10px] font-black uppercase transition-all shadow-[2px_2px_0px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_#1c1b1b] cursor-pointer
                            ${isAdded ? 'bg-[#10b981] text-white' : 'bg-white text-black hover:bg-zinc-50'}
                          `}
                        >
                          {isAdded ? '✓ Added' : '+ Watchlist'}
                        </button>
                      </div>
                    )
                  })}
                </div>

                <button
                  onClick={handleNext}
                  className="
                    group bg-[#1c1b1b] text-white border-4 border-black px-12 py-5 rounded-full 
                    font-display text-2xl italic shadow-[8px_8px_0px_0px_#fd56a7] 
                    hover:shadow-[12px_12px_0px_0px_#fd56a7] transition-all flex items-center justify-center gap-4 mx-auto 
                    uppercase relative z-20 cursor-pointer
                  "
                >
                  <span>enter war room</span>
                  <ArrowRight size={24} className="group-hover:translate-x-1.5 transition-transform text-[#fd56a7]" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Actions Row */}
        {step < 5 && (
          <div className="mt-8 w-full flex justify-between items-center shrink-0">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="px-6 py-3 border-3 border-black bg-white rounded-full font-headline text-sm font-bold shadow-[4px_4px_0px_#1c1b1b] active:translate-y-1 active:shadow-[0px_0px_0px_#1c1b1b] transition-all cursor-pointer hover:bg-zinc-100"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleNext}
              disabled={
                (step === 1 && selectedVibes.length === 0) ||
                (step === 2 && !selectedRisk) ||
                (step === 3 && !selectedTimeline)
              }
              className="flex items-center gap-2 px-8 py-3.5 border-4 border-black rounded-full font-headline text-sm font-bold shadow-[4px_4px_0px_#1c1b1b] active:translate-y-1 active:shadow-[0px_0px_0px_0px_#1c1b1b] transition-all cursor-pointer bg-[#fde047] text-[#1c1b1b] hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default Onboarding
