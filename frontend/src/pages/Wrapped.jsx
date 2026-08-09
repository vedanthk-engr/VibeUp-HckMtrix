import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVibeStore } from '../store/vibeStore'
import { useVoice } from '../hooks/useVoice'
import { api } from '../lib/api'
import html2canvas from 'html2canvas'
import ModelBadge from '../components/shared/ModelBadge'
import { 
  Sparkles, RotateCcw, Share2, Award, ArrowRight, ArrowLeft,
  ChevronRight, ThumbsUp, HeartCrack, AlertCircle, Volume2, VolumeX, Play, Pause
} from 'lucide-react'

// Simple count up animation component
function CountUp({ end, duration = 1.5, suffix = '' }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    if (end === 0) return
    const totalMiliseconds = duration * 1000
    const stepTime = Math.max(Math.floor(totalMiliseconds / Math.abs(end)), 25)
    
    const timer = setInterval(() => {
      start += Math.sign(end) * Math.ceil(Math.abs(end) / 25)
      if ((end > 0 && start >= end) || (end < 0 && start <= end)) {
        clearInterval(timer)
        setCount(end)
      } else {
        setCount(start)
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [end])

  return <span>{count.toLocaleString()}{suffix}</span>
}

export function Wrapped() {
  const { user, awardXP, setActivePage, theme, language, voiceStyle } = useVibeStore()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [currentCard, setCurrentCard] = useState(0)
  
  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const cardRef = useRef(null)
  const audioCtxRef = useRef(null)
  const synthIntervalRef = useRef(null)
  
  const durationPerSlide = 6500; // 6.5 seconds per slide

  // Voice engine hook
  const { speak, cancelSpeech } = useVoice({
    language,
    voiceStyle
  })

  // Procedural Web Audio API Synth Wave Loop
  const startSynthBGM = () => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
      const chords = [
        [110, 165, 220],      // Am sweep
        [98, 147, 196],       // G sweep
        [87.3, 130.8, 174.6], // F sweep
        [73.4, 110, 146.8]    // D sweep
      ];
      let chordIndex = 0;
      
      const playChord = () => {
        if (isMuted || !audioCtxRef.current) return;
        const now = audioCtx.currentTime;
        const notes = chords[chordIndex];
        chordIndex = (chordIndex + 1) % chords.length;
        
        notes.forEach((freq) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const filter = audioCtx.createBiquadFilter();
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now);
          
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(200, now);
          filter.frequency.exponentialRampToValueAtTime(500, now + 1.8);
          
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.015, now + 0.4); // Very quiet, background ambient pad
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.9);
          
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start(now);
          osc.stop(now + 5);
        });
      };
      
      playChord();
      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = setInterval(playChord, 5000);
    } catch (err) {
      console.warn("Procedural synthesizer loop was blocked or failed to initialize:", err);
    }
  };

  const stopSynthBGM = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
  };

  const fetchWrapped = async () => {
    if (!user) return
    setLoading(true)
    try {
      const response = await api.get(`/wrapped/${user.id}`)
      if (response.data) {
        setStats(response.data)
        // Simulate loading screen for 3 seconds
        setTimeout(() => {
          setLoading(false)
          // Award +50 XP for generating wrapped
          awardXP('wrapped_generated', 50)
        }, 3000)
      }
    } catch (err) {
      console.error('Failed to load wrapped:', err)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWrapped()
    return () => {
      stopSynthBGM();
      cancelSpeech();
    }
  }, [])

  // Auto-advance story player logic
  useEffect(() => {
    if (loading) return;
    if (isPaused) return;

    const intervalTime = 50; 
    const step = (intervalTime / durationPerSlide) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentCard((prevCard) => {
            if (prevCard < 5) {
              return prevCard + 1;
            } else {
              clearInterval(timer);
              return prevCard;
            }
          });
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [loading, isPaused, currentCard]);

  // Narrate and control synth BGM based on card changes
  useEffect(() => {
    if (loading) return;

    // Reset progress on slide changes
    setProgress(0);

    if (isMuted) {
      cancelSpeech();
      return;
    }

    cancelSpeech();

    let textToSpeak = "";
    if (currentCard === 0) {
      textToSpeak = `Your month in one word was ${stats?.one_word || 'VOLATILE'}. ${stats?.card1_desc || ''}`;
    } else if (currentCard === 1) {
      textToSpeak = `Let's look at your numbers. Your return rate was ${stats?.total_return_pct || 0} percent. You gained ${stats?.vibe_score_end - stats?.vibe_score_start} XP, read ${stats?.signals_read || 0} alerts, and unlocked ${stats?.cards_collected || 0} cards.`;
    } else if (currentCard === 2) {
      textToSpeak = `Your best call was ${stats?.best_holding?.ticker || 'N/A'} with a return of ${stats?.best_holding?.return_pct || 0} percent. Your worst call was ${stats?.worst_holding?.ticker || 'N/A'} with ${stats?.worst_holding?.return_pct || 0} percent.`;
    } else if (currentCard === 3) {
      textToSpeak = `Aurex analysis says: ${stats?.card4_behavioral_quote || ''}`;
    } else if (currentCard === 4) {
      textToSpeak = `Here is your behavioral risk breakdown. Let's look at your FOMO index, HODL strength, panic factor, and savage quotient.`;
    } else if (currentCard === 5) {
      textToSpeak = `Your mission for next month is: ${stats?.card5_mission || ''}`;
    }

    if (textToSpeak) {
      speak(textToSpeak);
    }

    startSynthBGM();
  }, [currentCard, loading, isMuted, stats]);

  const handleShare = async () => {
    if (!cardRef.current || sharing) return
    setSharing(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#fcf9f8',
        scale: 2
      })
      
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      const file = new File([blob], 'vibe-wrapped.png', { type: 'image/png' })
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My VibeUp Wrapped 🎁',
          text: 'Check out my financial month in 5 cards! #VibeUp'
        })
      } else {
        // Fallback: Download file
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'vibe-wrapped.png'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
      setShared(true)
      awardXP('wrapped_shared', 75)
    } catch (err) {
      console.warn('Share/Capture failed, downloading:', err)
    } finally {
      setSharing(false)
    }
  }

  const toggleMute = () => {
    if (!isMuted) {
      setIsMuted(true);
      cancelSpeech();
      stopSynthBGM();
    } else {
      setIsMuted(false);
    }
  };

  const handleNextCard = () => {
    if (currentCard < 5) {
      setCurrentCard(currentCard + 1);
      setProgress(0);
    }
  };

  const handlePrevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#1c1b1b] z-50 flex flex-col items-center justify-center text-center p-6 select-none">
        {/* Animated Rainbow Ribbon Sweep in background */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          <svg className="absolute w-[150vw] h-[150vh] top-[-20%] left-[-20%]" viewBox="0 0 1000 1000">
            <path d="M -100,500 C 300,500 400,200 1100,600" fill="none" stroke="#fd56a7" strokeWidth="60" />
            <path d="M -100,560 C 300,560 400,260 1100,660" fill="none" stroke="#7c3aed" strokeWidth="60" />
            <path d="M -100,620 C 300,620 400,320 1100,720" fill="none" stroke="#fde047" strokeWidth="60" />
          </svg>
        </div>

        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative z-10 space-y-4 px-4"
        >
          <div className="w-16 h-16 bg-[#fd56a7] border-4 border-white rounded-2xl flex items-center justify-center mx-auto shadow-[4px_4px_0px_#7c3aed] transform rotate-[-8deg] mb-6">
            <Sparkles size={32} className="text-white" />
          </div>
          <h2 className="font-display font-black text-xl md:text-2xl text-white tracking-tight uppercase max-w-md mx-auto leading-snug">
            Generating your financial story...
          </h2>
          <p className="font-mono text-zinc-400 text-xs tracking-widest">
            Aurex is compiling your gains and burns
          </p>
        </motion.div>
      </div>
    )
  }

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 350 : -350,
      opacity: 0,
      rotate: direction > 0 ? 6 : -6
    }),
    center: {
      x: 0,
      opacity: 1,
      rotate: 0,
      transition: { duration: 0.45, ease: 'easeOut' }
    },
    exit: (direction) => ({
      x: direction < 0 ? 350 : -350,
      opacity: 0,
      rotate: direction < 0 ? 6 : -6,
      transition: { duration: 0.35, ease: 'easeIn' }
    })
  }

  // Calculate Interactive Degen Risk Radar SVG path points
  const fomo = stats?.fomo_index || 50;
  const hodl = stats?.hodl_strength || 50;
  const panic = stats?.panic_factor || 50;
  const savage = stats?.savage_quotient || 50;

  // Center coordinate is (110, 110), max distance is 70
  const fomoY = 110 - (fomo / 100) * 70;
  const hodlX = 110 + (hodl / 100) * 70;
  const panicY = 110 + (panic / 100) * 70;
  const savageX = 110 - (savage / 100) * 70;

  return (
    <div className="fixed inset-0 bg-[#fcf9f8] z-45 flex flex-col items-center justify-center p-4 select-none">
      {/* Decorative sweeps */}
      <div className="absolute inset-0 pointer-events-none opacity-10 overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 1000 1000">
          <path d="M -100,200 C 300,400 400,600 1100,800" fill="none" stroke="#fd56a7" strokeWidth="40" />
          <path d="M -100,260 C 300,460 400,660 1100,860" fill="none" stroke="#7c3aed" strokeWidth="40" />
        </svg>
      </div>

      {/* Floating Header Controls */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-50">
        {/* Play/Pause & Mute controls */}
        <div className="flex gap-3">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 border-3 border-black rounded-xl bg-white hover:bg-zinc-50 shadow-[3px_3px_0px_#1c1b1b] cursor-pointer"
            title={isPaused ? "Play" : "Pause"}
          >
            {isPaused ? <Play size={14} className="fill-black" /> : <Pause size={14} className="fill-black" />}
          </button>
          <button 
            onClick={toggleMute}
            className="p-2 border-3 border-black rounded-xl bg-white hover:bg-zinc-50 shadow-[3px_3px_0px_#1c1b1b] cursor-pointer"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} className="animate-pulse" />}
          </button>
        </div>

        <button 
          onClick={() => setActivePage('profile')}
          className="p-2 px-4 rounded-xl border-3 border-black bg-white hover:bg-zinc-50 cursor-pointer shadow-[3px_3px_0px_#1c1b1b] text-xs font-black uppercase tracking-tight"
        >
          Exit wrapped
        </button>
      </div>

      {/* Segmented Story Progress Bars */}
      <div className="flex gap-2 w-full max-w-sm mb-6 z-10 px-4">
        {[0, 1, 2, 3, 4, 5].map((idx) => {
          let widthPct = 0;
          if (idx < currentCard) widthPct = 100;
          else if (idx === currentCard) widthPct = progress;
          
          return (
            <div key={idx} className="h-1.5 flex-1 bg-zinc-200 border border-black rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#fd56a7] transition-all duration-75"
                style={{ width: `${widthPct}%` }}
              />
            </div>
          )
        })}
      </div>

      {/* Card Window Container */}
      <div 
        className="w-full max-w-sm h-[500px] relative z-10 cursor-pointer" 
        ref={cardRef}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <AnimatePresence mode="wait">
          
          {/* CARD 1: ONE WORD - Cyan Sweep */}
          {currentCard === 0 && (
            <motion.div
              key="card1"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 border-4 border-black p-8 bg-[#ccfbf1] flex flex-col justify-between shadow-[8px_8px_0px_#1c1b1b] overflow-hidden"
              style={{ borderRadius: '24px' }}
            >
              {/* Retro swept lines */}
              <div className="absolute inset-0 pointer-events-none opacity-30">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M-10,30 L110,80" stroke="#0d9488" strokeWidth="15" fill="none" />
                  <path d="M-10,42 L110,92" stroke="#fd56a7" strokeWidth="10" fill="none" />
                </svg>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 font-headline">Vibe Wrapped · {stats?.month}</span>
                <h3 className="font-display font-extrabold text-2xl uppercase text-black mt-2 leading-none">THE VIBE AUDIT</h3>
              </div>

              <div className="text-center my-auto relative z-10">
                <h1 className="text-3xl md:text-4xl font-black font-display text-black uppercase tracking-tighter transform rotate-[-2deg] drop-shadow-[3px_3px_0px_#fde047]" style={{ WebkitTextStroke: '1.5px #1c1b1b' }}>
                  {stats?.one_word}
                </h1>
                <p className="text-[11px] font-bold text-teal-950 mt-4 max-w-[240px] mx-auto leading-relaxed bg-white border-2 border-black p-3 rounded-xl shadow-[2px_2px_0px_#000]">
                  "{stats?.card1_desc}"
                </p>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-teal-900 mt-auto font-black">
                <span>Hold deck to pause</span>
                <span>Slide 1/6</span>
              </div>
            </motion.div>
          )}

          {/* CARD 2: NUMBERS GRID - Yellow theme */}
          {currentCard === 1 && (
            <motion.div
              key="card2"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 border-4 border-black p-8 bg-[#fef08a] text-black flex flex-col justify-between shadow-[8px_8px_0px_#7c3aed]"
              style={{ borderRadius: '24px' }}
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#7c3aed] font-headline">THE RECKONING</span>
                <h3 className="font-display font-extrabold text-2xl uppercase text-black mt-1.5 leading-none">YOUR METRICS</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 my-auto">
                <div className="border-3 border-black p-3.5 rounded-xl bg-white shadow-[3px_3px_0px_#000]">
                  <span className="text-[8px] font-black text-zinc-500 uppercase block mb-1">Return Rate</span>
                  <div className={`text-xl font-black font-mono ${stats?.total_return_pct >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                    {stats?.total_return_pct >= 0 ? "+" : ""}<CountUp end={stats?.total_return_pct} suffix="%" />
                  </div>
                </div>

                <div className="border-3 border-black p-3.5 rounded-xl bg-white shadow-[3px_3px_0px_#000]">
                  <span className="text-[8px] font-black text-zinc-500 uppercase block mb-1">XP gain</span>
                  <div className="text-xl font-black font-mono text-violet-600">
                    +<CountUp end={stats?.vibe_score_end - stats?.vibe_score_start} suffix="" />
                  </div>
                </div>

                <div className="border-3 border-black p-3.5 rounded-xl bg-white shadow-[3px_3px_0px_#000]">
                  <span className="text-[8px] font-black text-zinc-500 uppercase block mb-1">Signals Read</span>
                  <div className="text-xl font-black font-mono text-[#0284c7]">
                    <CountUp end={stats?.signals_read} />
                  </div>
                </div>

                <div className="border-3 border-black p-3.5 rounded-xl bg-white shadow-[3px_3px_0px_#000]">
                  <span className="text-[8px] font-black text-zinc-500 uppercase block mb-1">Cards Discovered</span>
                  <div className="text-xl font-black font-mono text-pink-600">
                    <CountUp end={stats?.cards_collected} suffix="/50" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-black mt-auto font-black">
                <span>VibeUp Ledger telemetry</span>
                <span>Slide 2/6</span>
              </div>
            </motion.div>
          )}

          {/* CARD 3: BEST & WORST - High contrast split */}
          {currentCard === 2 && (
            <motion.div
              key="card3"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 border-4 border-black p-6 bg-[#ffe4e6] flex flex-col justify-between shadow-[8px_8px_0px_#1c1b1b]"
              style={{ borderRadius: '24px' }}
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 font-headline">PORTFOLIO DECK</span>
                <h3 className="font-display font-extrabold text-2xl uppercase text-black mt-1 leading-none">THE OUTCOMES</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 my-auto h-64">
                {/* Best Call */}
                <div className="border-3 border-black p-2.5 rounded-2xl bg-[#ecfdf5] flex flex-col justify-between transform -rotate-1 shadow-[2px_2px_0px_#000]">
                  <div className="overflow-hidden">
                    <span className="text-[7.5px] font-black text-emerald-800 uppercase tracking-tight flex items-center gap-1">
                      <ThumbsUp size={8} />
                      <span>BEST MOVE</span>
                    </span>
                    <h4 className="text-xs md:text-sm font-extrabold font-mono mt-1.5 leading-none text-black truncate max-w-full block" title={stats?.best_holding?.ticker}>{stats?.best_holding?.ticker}</h4>
                  </div>
                  <div>
                    <div className="text-xs md:text-sm font-black font-mono text-emerald-700">+{stats?.best_holding?.return_pct}%</div>
                    <p className="text-[7px] font-bold text-emerald-950 mt-1 font-headline italic leading-tight">
                      "{stats?.card3_best_insight}"
                    </p>
                  </div>
                </div>

                {/* Worst Call */}
                <div className="border-3 border-black p-2.5 rounded-2xl bg-[#fff1f2] flex flex-col justify-between transform rotate-1 shadow-[2px_2px_0px_#000]">
                  <div className="overflow-hidden">
                    <span className="text-[7.5px] font-black text-rose-800 uppercase tracking-tight flex items-center gap-1">
                      <HeartCrack size={8} />
                      <span>WORST HIT</span>
                    </span>
                    <h4 className="text-xs md:text-sm font-extrabold font-mono mt-1.5 leading-none text-black truncate max-w-full block" title={stats?.worst_holding?.ticker}>{stats?.worst_holding?.ticker}</h4>
                  </div>
                  <div>
                    <div className="text-xs md:text-sm font-black font-mono text-rose-700">{stats?.worst_holding?.return_pct}%</div>
                    <p className="text-[7px] font-bold text-rose-950 mt-1 font-headline italic leading-tight">
                      "{stats?.card3_worst_insight}"
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-rose-900 mt-auto font-black">
                <span>Calculated 30-day holdings</span>
                <span>Slide 3/6</span>
              </div>
            </motion.div>
          )}

          {/* CARD 4: BEHAVIOR AUDIT - speech bubble */}
          {currentCard === 3 && (
            <motion.div
              key="card4"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 border-4 border-black p-8 bg-[#f5f5f4] flex flex-col justify-between shadow-[8px_8px_0px_#e11d48]"
              style={{ borderRadius: '24px' }}
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 font-headline">Aurex Audit Report</span>
                <h3 className="font-display font-extrabold text-2xl uppercase text-black mt-2 leading-none">AUREX SAYS</h3>
              </div>

              <div className="my-auto text-left space-y-5">
                <p className="text-xs font-bold leading-relaxed font-sans text-white bg-black border-3 border-black p-4 rounded-xl shadow-[4px_4px_0px_#e11d48] italic relative">
                  "{stats?.card4_behavioral_quote}"
                  {/* Speech bubble arrow pointer */}
                  <span className="absolute bottom-[-10px] left-8 w-0 h-0 border-x-[8px] border-x-transparent border-t-[10px] border-t-black" />
                </p>

                {/* Badges Earned */}
                <div className="space-y-2 pt-2">
                  <span className="text-[8px] font-black uppercase tracking-wider text-zinc-500 block">BADGES EARNED</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: "Zen Holder", active: stats?.panic_factor < 40 },
                      { name: "Degen Speculator", active: stats?.fomo_index > 60 },
                      { name: "Diamond Hands", active: stats?.hodl_strength > 75 }
                    ].map(b => (
                      <span 
                        key={b.name} 
                        className={`text-[8px] font-black border-2 px-2 py-1 rounded-lg uppercase tracking-tight shadow-[2px_2px_0px_#000]
                          ${b.active ? 'bg-emerald-100 text-emerald-800 border-black' : 'bg-zinc-100 text-zinc-400 border-zinc-300 shadow-none'}
                        `}
                      >
                        {b.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 mt-auto font-black">
                <span>Discipline metric scores</span>
                <span>Slide 4/6</span>
              </div>
            </motion.div>
          )}

          {/* CARD 5: DYNAMIC SVG RADAR CHART - Cyan theme */}
          {currentCard === 4 && (
            <motion.div
              key="card5"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 border-4 border-black p-6 bg-[#e0f2fe] flex flex-col justify-between shadow-[8px_8px_0px_#000]"
              style={{ borderRadius: '24px' }}
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 font-headline">RISK DIAGRAM</span>
                <h3 className="font-display font-extrabold text-2xl uppercase text-black mt-1 leading-none">BEHAVIOR RADAR</h3>
              </div>

              {/* Dynamic SVG Radar Chart */}
              <div className="flex justify-center items-center my-auto h-[230px]">
                <svg width="220" height="220" viewBox="0 0 220 220" className="drop-shadow-[3px_3px_0px_rgba(0,0,0,0.15)]">
                  {/* Grid Lines */}
                  {[25, 50, 75, 100].map((level) => {
                    const r = (level / 100) * 70;
                    return (
                      <polygon
                        key={level}
                        points={`110,${110 - r} ${110 + r},110 110,${110 + r} ${110 - r},110`}
                        fill="none"
                        stroke="black"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        opacity={level === 100 ? "0.8" : "0.3"}
                      />
                    );
                  })}
                  
                  {/* Axis Crosslines */}
                  <line x1="110" y1="30" x2="110" y2="190" stroke="black" strokeWidth="1.5" opacity="0.4" />
                  <line x1="30" y1="110" x2="190" y2="110" stroke="black" strokeWidth="1.5" opacity="0.4" />
                  
                  {/* Metrics Radar Area Polygon */}
                  <polygon
                    points={`${110},${fomoY} ${hodlX},110 ${110},${panicY} ${savageX},110`}
                    fill="#a78bfa"
                    fillOpacity="0.6"
                    stroke="black"
                    strokeWidth="3"
                  />
                  
                  {/* Glowing Vertex Dots */}
                  <circle cx={110} cy={fomoY} r="5" fill="#fde047" stroke="black" strokeWidth="2.5" />
                  <circle cx={hodlX} cy={110} r="5" fill="#fde047" stroke="black" strokeWidth="2.5" />
                  <circle cx={110} cy={panicY} r="5" fill="#fde047" stroke="black" strokeWidth="2.5" />
                  <circle cx={savageX} cy={110} r="5" fill="#fde047" stroke="black" strokeWidth="2.5" />
                  
                  {/* Text Labels */}
                  <text x="110" y="22" fontFamily="Courier, monospace" fontSize="9" fontWeight="950" fill="black" textAnchor="middle">FOMO ({fomo})</text>
                  <text x="195" y="113" fontFamily="Courier, monospace" fontSize="9" fontWeight="950" fill="black" textAnchor="start">HODL ({hodl})</text>
                  <text x="110" y="208" fontFamily="Courier, monospace" fontSize="9" fontWeight="950" fill="black" textAnchor="middle">PANIC ({panic})</text>
                  <text x="25" y="113" fontFamily="Courier, monospace" fontSize="9" fontWeight="950" fill="black" textAnchor="end">SAVAGE ({savage})</text>
                </svg>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-sky-900 mt-auto font-black">
                <span>Interactive matrix diagram</span>
                <span>Slide 5/6</span>
              </div>
            </motion.div>
          )}

          {/* CARD 6: NEXT MONTH MISSION & SHARE */}
          {currentCard === 5 && (
            <motion.div
              key="card6"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 border-4 border-black p-8 bg-[#fae8ff] flex flex-col justify-between shadow-[8px_8px_0px_#7c3aed]"
              style={{ borderRadius: '24px' }}
            >
              {/* Graphic sweeps */}
              <div className="absolute inset-x-0 top-1/3 h-10 pointer-events-none opacity-20 overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0,5 Q25,10 50,5 T100,5" stroke="#7c3aed" strokeWidth="4" fill="none" />
                </svg>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 font-headline">TARGET CRITICAL</span>
                <h3 className="font-display font-extrabold text-2xl uppercase text-black mt-2 leading-none">THE ROADMAP</h3>
              </div>

              <div className="text-center my-auto relative z-10 space-y-8">
                <h2 className="text-2xl font-black font-display text-black uppercase tracking-tight leading-snug">
                  {stats?.card5_mission}
                </h2>

                <button
                  onClick={handleShare}
                  className="mx-auto flex items-center justify-center gap-1.5 py-3 px-8 rounded-full border-3 border-black bg-black text-[#fde047] text-xs font-black shadow-[4px_4px_0px_#7c3aed] cursor-pointer hover:bg-zinc-800 active:translate-y-0.5 active:shadow-none transition-all uppercase"
                >
                  <Share2 size={14} className={sharing ? "animate-spin" : ""} />
                  <span>{sharing ? "Capturing..." : "Share this 🤳"}</span>
                </button>

                {shared && (
                  <p className="text-[9px] text-[#2e7d32] font-black uppercase tracking-wider animate-bounce">
                    +75 XP Awarded for sharing your wrapped! ⚡
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-purple-900 mt-auto font-black">
                <span>VibeUp — vibeup.in</span>
                <span>Slide 6/6</span>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Manual Slide Toggles */}
      <div className="flex justify-between items-center w-full max-w-sm mt-8 z-10 px-4">
        <button 
          onClick={handlePrevCard} 
          disabled={currentCard === 0}
          className="p-2 border-3 border-black rounded-xl bg-white hover:bg-zinc-50 shadow-[3px_3px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none cursor-pointer disabled:opacity-40 disabled:hover:bg-white disabled:translate-y-0 disabled:shadow-[3px_3px_0px_#1c1b1b]"
        >
          <ArrowLeft size={16} />
        </button>

        <span className="font-mono text-xs font-extrabold text-zinc-600 uppercase">
          Slide {currentCard + 1} / 6
        </span>

        <button 
          onClick={handleNextCard} 
          disabled={currentCard === 5}
          className="p-2 border-3 border-black rounded-xl bg-[#fd56a7] hover:bg-pink-400 shadow-[3px_3px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none cursor-pointer disabled:opacity-40 disabled:hover:bg-[#fd56a7] disabled:translate-y-0 disabled:shadow-[3px_3px_0px_#1c1b1b]"
        >
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

export default Wrapped
