import React from 'react'
import { Activity, Zap, Sparkles, Briefcase, Skull, User, Rocket, ChevronLeft, ChevronRight, Flame, ShieldAlert, Award } from 'lucide-react'
import { useVibeStore } from '../../store/vibeStore'


export function Navbar() {
  const { activePage, setActivePage, isSidebarCollapsed, setSidebarCollapsed, vibeScore } = useVibeStore()

  // Hide navigation bar during Splash and Onboarding screens
  if (activePage === 'splash' || activePage === 'onboarding') {
    return null
  }

  const navItems = [
    { id: 'warroom', label: 'War Room', icon: Activity },
    { id: 'signals', label: 'Signals', icon: Zap },
    { id: 'picks', label: 'Vibe Picks', icon: Sparkles },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'stress', label: 'Stress Test', icon: ShieldAlert },
    { id: 'regret', label: 'Regret Sim', icon: Skull },
    { id: 'arbitrage', label: 'Arbitrage Scanner', icon: Rocket },
    { id: 'forecaster', label: 'Quant Forecast', icon: Flame },
    { id: 'cards', label: 'Cards', icon: Award },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  return (
    <>
      {/* Desktop Sidebar (Left-aligned, collapsible) */}
      <nav className={`hidden md:flex flex-col py-8 z-45 bg-white h-screen fixed left-0 top-0 border-r-4 border-bg-darker shadow-[8px_0px_0px_0px_#1c1b1b] transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        {/* Brand Logo */}
        <div className={`flex flex-col items-start mb-6 w-full relative text-left transition-all duration-300 ${isSidebarCollapsed ? 'items-center px-2' : 'px-6'}`}>
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <h1 className="font-display text-primary text-2xl font-extrabold tracking-tight italic drop-shadow-[1px_1px_0px_#fd56a7] cursor-pointer" onClick={() => setSidebarCollapsed(false)}>VU⚡</h1>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center w-full">
                <h1 className="font-display text-primary text-3xl font-extrabold tracking-tight italic drop-shadow-[2px_2px_0px_#fd56a7]">VibeUp</h1>
              </div>
              <p className="text-[10px] text-on-background font-black transform -rotate-2 bg-[#fde047] px-2 py-1 border-2 border-black rounded-lg inline-block mt-2 select-none">
                Your Wealth, Your Vibe
              </p>
            </>
          )}
        </div>

        {/* Navigation list */}
        <div className="flex-1 flex flex-col gap-1.5 w-full mt-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id

            if (isSidebarCollapsed) {
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  title={item.label}
                  className={`
                    mx-auto flex items-center justify-center w-12 h-12 rounded-xl font-bold border-2 transition-all cursor-pointer
                    ${isActive 
                      ? 'bg-secondary-container text-black border-bg-darker shadow-[3px_3px_0px_0px_#1c1b1b] transform rotate-2' 
                      : 'text-zinc-600 hover:bg-zinc-100 border-transparent hover:border-bg-darker'
                    }
                  `}
                >
                  <Icon size={20} className={isActive ? 'text-black' : 'text-zinc-500'} />
                </button>
              )
            }

            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`
                  mx-3 flex items-center gap-4 p-3 rounded-xl font-bold border-2 transition-all cursor-pointer text-left
                  ${isActive 
                    ? 'bg-secondary-container text-black border-bg-darker shadow-[4px_4px_0px_0px_#1c1b1b] transform rotate-1' 
                    : 'text-zinc-600 hover:bg-zinc-100 border-transparent hover:border-bg-darker'
                  }
                `}
              >
                <Icon size={18} className={isActive ? 'text-black' : 'text-zinc-500'} />
                <span className="font-headline text-sm font-bold">{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Sidebar Toggle Button (Above VibeScore, aligned right) */}
        <div className={`mt-auto w-full flex ${isSidebarCollapsed ? 'justify-center mb-2' : 'justify-end px-6 mb-2'}`}>
          <button 
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="text-zinc-400 hover:text-black transition-colors cursor-pointer p-1"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight size={14} className="stroke-[3]" />
            ) : (
              <ChevronLeft size={14} className="stroke-[3]" />
            )}
          </button>
        </div>

        {/* VibeScore progress bar */}
        {isSidebarCollapsed ? (
          <div className="flex flex-col items-center">
            <div 
              className="w-10 h-10 rounded-full border-3 border-black bg-bg-cream flex items-center justify-center font-bold text-xs shadow-[2px_2px_0px_#1c1b1b] cursor-help" 
              title={`VibeScore: ${vibeScore} XP`}
            >
              ⚡
            </div>
          </div>
        ) : (
          <div className="px-5 w-full">
            <div className="border-3 border-black p-3 rounded-xl bg-bg-cream relative shadow-[2px_2px_0px_#1c1b1b]">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-wider mb-1 text-black">
                <span className="truncate max-w-[110px]">VibeScore</span>
                <span className="text-[#630ed4] shrink-0">{vibeScore} XP</span>
              </div>
              <div className="w-full h-3 bg-zinc-200 rounded-full border-2 border-black overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-[#630ed4] to-[#fd56a7] transition-all duration-300"
                  style={{ width: `${Math.min(100, (vibeScore % 100))}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 pb-safe bg-white border-t-4 border-bg-darker shadow-[0_-8px_0px_#1c1b1b] rounded-t-2xl">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon
          const isActive = activePage === item.id

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`
                flex flex-col items-center gap-1 py-1 rounded-xl transition-all cursor-pointer text-center
                ${isActive 
                  ? 'bg-[#fde047] p-2 px-3 border-2 border-black shadow-[2px_2px_0px_0px_#1c1b1b] transform -translate-y-2 text-black' 
                  : 'text-zinc-500 hover:text-zinc-300'
                }
              `}
            >
              <Icon size={16} />
              <span className="text-[9px] font-bold font-headline">{item.label.split(' ')[0]}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}

export default Navbar

