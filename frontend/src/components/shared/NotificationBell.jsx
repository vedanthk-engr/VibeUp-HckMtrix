import React, { useState, useEffect } from 'react'
import { Bell, Trophy, ShieldAlert, BadgeInfo, PlayCircle, Star } from 'lucide-react'
import { useVibeStore } from '../../store/vibeStore'

export function NotificationBell() {
  const [showDropdown, setShowDropdown] = useState(false)
  const { notifications, unreadNotificationsCount, fetchNotifications, markNotificationsRead } = useVibeStore()

  useEffect(() => {
    fetchNotifications()
    const timer = setInterval(fetchNotifications, 10000)
    return () => clearInterval(timer)
  }, [])

  const handleBellClick = (e) => {
    e.stopPropagation()
    setShowDropdown(!showDropdown)
    if (!showDropdown) {
      markNotificationsRead()
    }
  }

  useEffect(() => {
    const closeDropdown = () => setShowDropdown(false)
    window.addEventListener('click', closeDropdown)
    return () => window.removeEventListener('click', closeDropdown)
  }, [])

  const getIcon = (type) => {
    switch (type) {
      case 'card_unlocked':
        return <Star size={12} className="text-[#fde047] fill-[#fde047]" />
      case 'xp_milestone':
        return <Trophy size={12} className="text-amber-500 fill-amber-100" />
      case 'whale_alert':
        return <ShieldAlert size={12} className="text-[#ef4444]" />
      case 'earnings_live':
        return <PlayCircle size={12} className="text-[#00d09c]" />
      case 'stress_test_complete':
        return <ShieldAlert size={12} className="text-[#7c3aed]" />
      default:
        return <BadgeInfo size={12} className="text-zinc-400" />
    }
  }

  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button 
        onClick={handleBellClick} 
        className="p-2 rounded-xl border-3 border-black bg-white hover:bg-zinc-50 cursor-pointer shadow-[3px_3px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-[1px_1px_0px_#1c1b1b] transition-all relative flex items-center justify-center"
      >
        <Bell size={18} className="text-black" />
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-[#ef4444] text-white border-2 border-black text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
            {unreadNotificationsCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-3 w-72 bg-white border-3 border-black rounded-2xl p-4 shadow-[6px_6px_0px_#1c1b1b] z-50 transition-all">
          <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-3">
            <h4 className="font-display font-extrabold text-sm uppercase text-black tracking-tight flex items-center gap-1.5">
              <span>Alert Box</span>
              <Bell size={12} className="fill-black animate-swing" />
            </h4>
            {unreadNotificationsCount > 0 && (
              <span className="text-[9px] font-bold bg-[#fde047] border-2 border-black px-1.5 py-0.2 rounded-md">
                NEW
              </span>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-[11px] text-zinc-500 font-mono py-4 text-center">No alerts in your bag yet, bestie.</p>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className="flex gap-2.5 items-start text-xs font-headline border-b border-zinc-100 pb-2.5 last:border-0 last:pb-0"
                >
                  <div className="mt-0.5 shrink-0 p-1 bg-zinc-50 border border-black rounded-lg">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-black leading-tight break-words">{n.message}</p>
                    <span className="text-[9px] text-zinc-400 font-mono block mt-1">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
