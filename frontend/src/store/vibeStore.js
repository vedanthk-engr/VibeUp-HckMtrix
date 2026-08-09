import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

const GUEST_USER = {
  id: 'guest_user',
  email: 'guest@vibeup.ai',
  user_metadata: { full_name: 'Gen Z Investor' }
}

export const useVibeStore = create((set, get) => ({
  // State
  user: GUEST_USER,
  riskArchetype: 'FOMO Trader',
  vibeSelections: ['🚀 Bet on India\'s glow-up'],
  startingCapital: 10000,
  holdings: [],
  watchlist: ['ZOMATO', 'TITAN'],
  theme: 'Dark', // Dark, Darker, Pure Black
  language: 'en-IN',
  voiceStyle: 'energetic',
  isInitialized: false,
  activePage: 'warroom',
  isSidebarCollapsed: false,
  activeDebateTicker: 'ZOMATO',
  vibeScore: 0,
  vibeTier: 'Paper Hands Beginner',
  xpHistory: [],
  notifications: [],
  unreadNotificationsCount: 0,
  discoveredCardsCount: 0,
  cards: [],

  // Setters
  setUser: (user) => {
    set({ user: user || GUEST_USER })
    if (user) {
      get().loadProfile()
    }
  },
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
  setVoiceStyle: (voiceStyle) => set({ voiceStyle }),
  setActivePage: (activePage) => set({ activePage }),
  setSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
  setActiveDebateTicker: (activeDebateTicker) => set({ activeDebateTicker: activeDebateTicker.toUpperCase() }),

  // Auth Action
  initializeAuth: () => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        set({ user: session.user })
        get().loadProfile()
      } else {
        set({ user: GUEST_USER, isInitialized: false })
      }
    })

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        set({ user: session.user })
        get().loadProfile()
      } else {
        // Clear all user-specific state on sign out
        set({
          user: null,
          riskArchetype: 'FOMO Trader',
          vibeSelections: ['🚀 Bet on India\'s glow-up'],
          startingCapital: 10000,
          holdings: [],
          isInitialized: false,
          activePage: 'splash',
          vibeScore: 0,
          vibeTier: 'Paper Hands Beginner',
          xpHistory: [],
          notifications: [],
          unreadNotificationsCount: 0,
          discoveredCardsCount: 0,
          cards: []
        })
      }
    })

    return subscription
  },

  // Watchlist Actions
  toggleWatchlist: (ticker) => {
    const { watchlist } = get()
    const upper = ticker.toUpperCase()
    if (watchlist.includes(upper)) {
      set({ watchlist: watchlist.filter(t => t !== upper) })
    } else {
      set({ watchlist: [...watchlist, upper] })
    }
  },

  // Onboarding Save Action
  setOnboardingProfile: async (archetype, vibes, capital) => {
    set({
      riskArchetype: archetype,
      vibeSelections: vibes,
      startingCapital: capital,
      isInitialized: true
    })

    const { user } = get()
    // Local cache fallback
    localStorage.setItem(`vibeup_profile_${user?.id || 'guest'}`, JSON.stringify({
      riskArchetype: archetype,
      vibeSelections: vibes,
      startingCapital: capital,
      isInitialized: true
    }))

    if (user && user.id !== 'default_user') {
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          risk_archetype: archetype,
          vibe_selections: JSON.stringify(vibes),
          cash_balance: capital
        }).select().single()
      } catch (err) {
        console.error('Failed to sync profile to database, using local state:', err)
      }
    }
  },

  // Holdings Actions
  fetchHoldings: async () => {
    const { user } = get()
    if (!user) return
    try {
      // Try to fetch from backend for live P&L computation
      const response = await api.get(`/portfolio/holdings?user_id=${user.id}`)
      if (response.data) {
        set({ holdings: response.data })
        return
      }
    } catch (err) {
      console.warn('Backend fetch failed, pulling from Supabase/local client:', err)
    }

    // Fallback directly to Supabase client
    if (user.id !== 'default_user') {
      try {
        const { data } = await supabase.from('holdings').select('*').eq('user_id', user.id)
        if (data) {
          // Map keys to match API structure
          const mapped = data.map(h => ({
            ...h,
            current_price: h.avg_buy_price, // Fallback if no backend
            pnl: 0,
            pnl_percentage: 0
          }))
          set({ holdings: mapped })
        }
      } catch (dbErr) {
        console.error('Database fetch holdings failed:', dbErr)
      }
    }
  },

  addHolding: async (holdingData) => {
    const { user } = get()
    if (!user) return
    try {
      // Send to backend
      const response = await api.post(`/portfolio/holdings?user_id=${user.id}`, {
        ticker: holdingData.ticker.toUpperCase(),
        exchange: holdingData.exchange || 'NSE',
        quantity: parseFloat(holdingData.quantity),
        avg_buy_price: parseFloat(holdingData.avg_buy_price),
        buy_date: holdingData.buy_date,
        is_paper: holdingData.is_paper || false
      })
      if (response.data) {
        set((state) => ({ holdings: [...state.holdings, response.data] }))
        return
      }
    } catch (err) {
      console.warn('Backend add failed, writing to Supabase/local client:', err)
    }

    // Fallback
    if (user.id !== 'default_user') {
      try {
        const newHolding = {
          user_id: user.id,
          ticker: holdingData.ticker.toUpperCase(),
          exchange: holdingData.exchange || 'NSE',
          quantity: parseFloat(holdingData.quantity),
          avg_buy_price: parseFloat(holdingData.avg_buy_price),
          buy_date: holdingData.buy_date,
          is_paper: holdingData.is_paper || false
        }
        const { data } = await supabase.from('holdings').insert(newHolding).select()
        if (data && data[0]) {
          const item = {
            ...data[0],
            current_price: data[0].avg_buy_price,
            pnl: 0,
            pnl_percentage: 0
          }
          set((state) => ({ holdings: [...state.holdings, item] }))
        }
      } catch (dbErr) {
        console.error('Database add holdings failed:', dbErr)
      }
    }
  },

  deleteHolding: async (holdingId) => {
    const { user } = get()
    if (!user) return
    try {
      await api.delete(`/portfolio/holdings/${holdingId}?user_id=${user.id}`)
      set((state) => ({ holdings: state.holdings.filter(h => h.id !== holdingId) }))
      return
    } catch (err) {
      console.warn('Backend delete failed, writing to Supabase/local client:', err)
    }

    if (user.id !== 'default_user') {
      try {
        await supabase.from('holdings').delete().eq('id', holdingId)
        set((state) => ({ holdings: state.holdings.filter(h => h.id !== holdingId) }))
      } catch (dbErr) {
        console.error('Database delete holdings failed:', dbErr)
      }
    }
  },

  // Load profile on initial application load
  loadProfile: async () => {
    const { user } = get()
    if (!user) return

    // 1. Try to load from localStorage first as local cache/fallback
    const localProfileStr = localStorage.getItem(`vibeup_profile_${user.id}`)
    if (localProfileStr) {
      try {
        const localProfile = JSON.parse(localProfileStr)
        let localVibes = localProfile.vibeSelections || ['🚀 Bet on India\'s glow-up']
        if (typeof localVibes === 'string') {
          try {
            localVibes = JSON.parse(localVibes)
          } catch (e) {
            localVibes = [localVibes]
          }
        }
        set({
          riskArchetype: localProfile.riskArchetype || 'FOMO Trader',
          vibeSelections: Array.isArray(localVibes) ? localVibes : [localVibes],
          startingCapital: localProfile.startingCapital || 10000,
          isInitialized: true
        })
        if (localProfile.displayName) {
          set((state) => ({
            user: {
              ...state.user,
              user_metadata: {
                ...(state.user?.user_metadata || {}),
                full_name: localProfile.displayName
              }
            }
          }))
        }
      } catch (e) {
        console.warn('Failed to parse local profile:', e)
      }
    }

    // 2. Try to sync/fetch from real Supabase database if available
    if (user.id !== 'default_user') {
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id)
        if (data && data[0]) {
          const archetype = data[0].risk_archetype || 'FOMO Trader'
          let vibes = data[0].vibe_selections || ['🚀 Bet on India\'s glow-up']
          if (typeof vibes === 'string') {
            try {
              vibes = JSON.parse(vibes)
            } catch (e) {
              console.warn('Failed to parse vibe selections:', e)
              vibes = [vibes]
            }
          }
          const capital = data[0].cash_balance || 10000
          
          set({
            riskArchetype: archetype,
            vibeSelections: Array.isArray(vibes) ? vibes : [vibes],
            startingCapital: capital,
            isInitialized: true
          })
          
          // Update local cache
          const localProfile = localProfileStr ? JSON.parse(localProfileStr) : {}
          localStorage.setItem(`vibeup_profile_${user.id}`, JSON.stringify({
            ...localProfile,
            riskArchetype: archetype,
            vibeSelections: vibes,
            startingCapital: capital,
            isInitialized: true
          }))
        }
      } catch (err) {
        console.warn('Failed to load profile from Supabase:', err)
      }
    }

    // Also trigger holdings fetch
    get().fetchHoldings()
    get().fetchVibeScore()
    get().fetchNotifications()
    get().fetchCollection()
  },

  fetchVibeScore: async () => {
    const { user } = get()
    if (!user) return
    try {
      const response = await api.get(`/vibescore/${user.id}`)
      if (response.data) {
        set({
          vibeScore: response.data.current_score,
          vibeTier: response.data.tier,
          xpHistory: response.data.xp_history
        })
      }
    } catch (err) {
      console.warn('Failed to fetch XP:', err)
    }
  },

  awardXP: async (eventType, xpAmount) => {
    const { user } = get()
    if (!user) return
    try {
      const response = await api.post('/vibescore/award', {
        user_id: user.id,
        event_type: eventType,
        xp_amount: parseFloat(xpAmount)
      })
      if (response.data && response.data.success) {
        set({
          vibeScore: response.data.new_score,
          vibeTier: response.data.tier
        })
        await get().fetchVibeScore()
        await get().fetchNotifications()
      }
    } catch (err) {
      console.warn('Failed to award XP:', err)
    }
  },

  fetchNotifications: async () => {
    const { user } = get()
    if (!user) return
    try {
      const response = await api.get(`/vibescore/notifications/${user.id}`)
      if (response.data) {
        set({
          notifications: response.data.notifications,
          unreadNotificationsCount: response.data.unread_count
        })
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err)
    }
  },

  markNotificationsRead: async () => {
    const { user } = get()
    if (!user) return
    try {
      const response = await api.post(`/vibescore/notifications/read/${user.id}`)
      if (response.data && response.data.success) {
        set({ unreadNotificationsCount: 0 })
        await get().fetchNotifications()
      }
    } catch (err) {
      console.warn('Failed to mark notifications read:', err)
    }
  },

  unlockCard: async (ticker, trigger) => {
    const { user } = get()
    if (!user) return
    try {
      const response = await api.post('/cards/unlock', {
        user_id: user.id,
        ticker: ticker,
        trigger: trigger
      })
      if (response.data && response.data.success) {
        await get().fetchCollection()
        await get().fetchVibeScore()
        await get().fetchNotifications()
        return response.data
      }
    } catch (err) {
      console.warn('Failed to unlock card:', err)
    }
    return null;
  },

  fetchCollection: async () => {
    const { user } = get()
    if (!user) return
    try {
      const response = await api.get(`/cards/collection/${user.id}`)
      if (response.data) {
        set({
          cards: response.data.cards,
          discoveredCardsCount: response.data.discovered_count
        })
      }
    } catch (err) {
      console.warn('Failed to fetch card collection:', err)
    }
  },

  fuseCard: async (ticker) => {
    const { user } = get()
    if (!user) return null
    try {
      const response = await api.post('/cards/fuse', {
        user_id: user.id,
        ticker: ticker
      })
      if (response.data && response.data.success) {
        await get().fetchCollection()
        await get().fetchVibeScore()
        await get().fetchNotifications()
        return response.data
      }
    } catch (err) {
      console.warn('Failed to fuse card:', err)
    }
    return null
  },

  stakeCard: async (ticker) => {
    const { user } = get()
    if (!user) return null
    try {
      const response = await api.post('/cards/stake', {
        user_id: user.id,
        ticker: ticker
      })
      if (response.data && response.data.success) {
        await get().fetchCollection()
        await get().fetchVibeScore()
        await get().fetchNotifications()
        return response.data
      }
    } catch (err) {
      console.warn('Failed to stake card:', err)
    }
    return null
  },

  unstakeCard: async (ticker) => {
    const { user } = get()
    if (!user) return null
    try {
      const response = await api.post('/cards/unstake', {
        user_id: user.id,
        ticker: ticker
      })
      if (response.data && response.data.success) {
        await get().fetchCollection()
        await get().fetchVibeScore()
        await get().fetchNotifications()
        return response.data
      }
    } catch (err) {
      console.warn('Failed to unstake card:', err)
    }
    return null
  }
}))
