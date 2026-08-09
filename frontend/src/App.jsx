import React, { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useVibeStore } from './store/vibeStore'
import { Navbar } from './components/shared/Navbar'
import { IndexBar } from './components/WarRoom/IndexBar'
import { Mic, User, MessageSquare } from 'lucide-react'

// Pages
import { Splash } from './pages/Splash'
import { Onboarding } from './pages/Onboarding'
import { WarRoom } from './pages/WarRoom'
import { Signals } from './pages/Signals'
import { Picks } from './pages/Picks'
import { Debate } from './pages/Debate'
import { Chat } from './pages/Chat'
import { Portfolio } from './pages/Portfolio'
import { Regret } from './pages/Regret'
import { Profile } from './pages/Profile'
import { Cards } from './pages/Cards'
import { SectorPulse } from './pages/SectorPulse'
import { WhaleTracker } from './pages/WhaleTracker'
import { Wrapped } from './pages/Wrapped'
import { StressTest } from './pages/StressTest'
import { Arbitrage } from './pages/Arbitrage'
import { MonteCarlo } from './pages/MonteCarlo'
import { NotificationBell } from './components/shared/NotificationBell'
import { Auth } from './pages/Auth'

export function App() {
  const { user, initializeAuth, activePage, theme, setActivePage, isSidebarCollapsed } = useVibeStore()

  useEffect(() => {
    const sub = initializeAuth()
    return () => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe()
      }
    }
  }, [])

  // Resolve background colors based on active theme
  const getThemeBackground = () => {
    if (theme === 'Darker') return 'bg-[#15151a] text-zinc-200'
    if (theme === 'Pure Black OLED') return 'bg-[#000000] text-zinc-100'
    return 'bg-[#fcf9f8] text-[#1c1b1b]' // Warm Cream default
  }

  const showFrame = activePage !== 'splash' && activePage !== 'onboarding' && activePage !== 'auth'

  if (activePage === 'auth') {
    return (
      <div className={`min-h-screen flex flex-col transition-colors duration-300 ${getThemeBackground()}`}>
        <Auth />
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${getThemeBackground()}`}>
      
      {/* Decorative Wavy Ribbon SVGs in background */}
      {showFrame && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30 select-none">
          <svg className="absolute w-[150vw] h-[150vh] top-[-20vh] left-[-20vw]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1000 1000">
            <path d="M -100,200 C 300,400 400,600 1100,800" fill="none" stroke="#fd56a7" strokeLinecap="round" strokeWidth="60" />
            <path d="M -100,280 C 300,480 400,680 1100,880" fill="none" stroke="#7c3aed" strokeLinecap="round" strokeWidth="60" />
            <path d="M -100,360 C 300,560 400,760 1100,960" fill="none" stroke="#fde047" strokeLinecap="round" strokeWidth="60" />
          </svg>
        </div>
      )}

      {/* Mobile Top Header */}
      {showFrame && (
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b-4 border-bg-darker fixed top-0 left-0 w-full z-45 shadow-[0_4px_0px_0px_#1c1b1b]">
          <h1 className="font-display text-primary text-xl font-extrabold tracking-tight italic drop-shadow-[2px_2px_0px_#fd56a7]">VibeUp</h1>
          <div className="flex gap-2 items-center">
            <NotificationBell />
            <button 
              onClick={() => setActivePage('chat')}
              className="p-1.5 text-primary border-2 border-black rounded-lg bg-white shadow-[2px_2px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none"
            >
              <Mic size={16} />
            </button>
            <button 
              onClick={() => setActivePage('profile')}
              className="p-1.5 text-primary border-2 border-black rounded-lg bg-white shadow-[2px_2px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-none"
            >
              <User size={16} />
            </button>
          </div>
        </header>
      )}

      {/* Live Market Index Bar — shown on all pages except splash/onboarding */}
      {showFrame && <IndexBar />}

      {/* Main Pages scroll viewport */}
      <main className={`flex-1 relative z-10 transition-all duration-300 ${
        showFrame 
          ? `mt-24 md:mt-10 p-4 md:p-10 ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}` 
          : ''
      }`}>
        <AnimatePresence mode="wait">
          {activePage === 'splash' && <Splash key="splash" />}
          {activePage === 'onboarding' && <Onboarding key="onboarding" />}
          {activePage === 'warroom' && <WarRoom key="warroom" />}
          {activePage === 'signals' && <Signals key="signals" />}
          {activePage === 'picks' && <Picks key="picks" />}
          {activePage === 'debate' && <Debate key="debate" />}
          {activePage === 'chat' && <Chat key="chat" />}
          {activePage === 'portfolio' && <Portfolio key="portfolio" />}
          {activePage === 'stress' && <StressTest key="stress" />}
          {activePage === 'regret' && <Regret key="regret" />}
          {activePage === 'whale-tracker' && <WhaleTracker key="whale" />}
          {activePage === 'sector-pulse' && <SectorPulse key="sector" />}
          {activePage === 'cards' && <Cards key="cards" />}
          {activePage === 'wrapped' && <Wrapped key="wrapped" />}
          {activePage === 'arbitrage' && <Arbitrage key="arbitrage" />}
          {activePage === 'forecaster' && <MonteCarlo key="forecaster" />}
          {activePage === 'profile' && <Profile key="profile" />}
        </AnimatePresence>
      </main>

      {/* Desktop Notification Bell in Right Corner of Dashboard */}
      {showFrame && (
        <div className="hidden md:block fixed top-12 right-10 z-45">
          <NotificationBell />
        </div>
      )}

      {/* Floating Action Button - Co-pilot Chat */}
      {showFrame && activePage !== 'chat' && (
        <button
          onClick={() => setActivePage('chat')}
          className="
            fixed bottom-24 md:bottom-8 right-6 md:right-8 w-14 h-14 
            bg-[#fde047] text-black rounded-full flex items-center justify-center 
            shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] border-3 border-black z-45 
            hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] 
            active:translate-y-1 active:shadow-[0px_0px_0px_0px_rgba(26,26,26,1)] transition-all cursor-pointer
          "
          title="Open AI Co-pilot"
        >
          <MessageSquare size={20} className="text-black" />
        </button>
      )}

      {/* Navigation bar */}
      <Navbar />

    </div>
  )
}

export default App
