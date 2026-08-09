import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useVibeStore } from '../store/vibeStore'
import { Lock, Mail, UserPlus, LogIn, AlertCircle } from 'lucide-react'

export function Auth() {
  const { setUser, setActivePage } = useVibeStore()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleAuth = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    if (!email || !password) {
      setError('Please fill out all fields.')
      setLoading(false)
      return
    }

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError
        
        // Supabase might require email confirmation, show notification
        if (data?.user && data.session === null) {
          setMessage('Vibe Check: Verification email sent! Please check your inbox.')
        } else {
          setMessage('Account created! Logging you in...')
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#faf7f2]">
      {/* Decorative Wavy Ribbons in Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-30 select-none">
        <svg className="absolute w-[150vw] h-[150vh] top-[-20vh] left-[-20vw]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1000 1000">
          <path d="M -100,200 C 300,400 400,600 1100,800" fill="none" stroke="#fd56a7" strokeLinecap="round" strokeWidth="60" />
          <path d="M -100,280 C 300,480 400,680 1100,880" fill="none" stroke="#7c3aed" strokeLinecap="round" strokeWidth="60" />
          <path d="M -100,360 C 300,560 400,760 1100,960" fill="none" stroke="#fde047" strokeLinecap="round" strokeWidth="60" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_0px_#1c1b1b] relative z-10"
      >
        {/* Branding header */}
        <div className="text-center mb-8">
          <h1 
            className="font-display text-5xl text-[#1c1b1b] tracking-tighter italic select-none"
            style={{ textShadow: '4px 4px 0 #fd56a7' }}
          >
            VibeUp
          </h1>
          <p className="font-headline text-xs text-zinc-600 mt-2 uppercase tracking-widest font-mono">
            Enter the Investment Terminal
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-4 border-black rounded-2xl overflow-hidden mb-6 bg-[#1c1b1b] p-1 gap-1">
          <button
            onClick={() => { setIsSignUp(false); setError(null); setMessage(null); }}
            className={`flex-1 py-3 text-center font-headline text-sm rounded-xl transition-all cursor-pointer ${
              !isSignUp 
                ? 'bg-[#fde047] text-black border-2 border-black font-bold shadow-[2px_2px_0px_#000]' 
                : 'text-white hover:text-[#fde047]'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setIsSignUp(true); setError(null); setMessage(null); }}
            className={`flex-1 py-3 text-center font-headline text-sm rounded-xl transition-all cursor-pointer ${
              isSignUp 
                ? 'bg-[#fde047] text-black border-2 border-black font-bold shadow-[2px_2px_0px_#000]' 
                : 'text-white hover:text-[#fde047]'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          {/* Email input */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider font-mono text-zinc-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="email"
                placeholder="you@vibeup.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-50 border-3 border-black rounded-xl py-3.5 pl-12 pr-4 font-headline text-sm focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_#fd56a7] transition-all"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider font-mono text-zinc-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-50 border-3 border-black rounded-xl py-3.5 pl-12 pr-4 font-headline text-sm focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_#7c3aed] transition-all"
              />
            </div>
          </div>

          {/* Feedback alerts */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-rose-50 border-3 border-rose-500 text-rose-800 p-3 rounded-2xl flex items-start gap-2.5"
              >
                <AlertCircle className="shrink-0 text-rose-500 mt-0.5" size={16} />
                <span className="text-xs font-semibold">{error}</span>
              </motion.div>
            )}

            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-emerald-50 border-3 border-emerald-500 text-emerald-800 p-3 rounded-2xl flex items-start gap-2.5"
              >
                <div className="shrink-0 text-emerald-500 mt-0.5 text-base">✨</div>
                <span className="text-xs font-semibold">{message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7c3aed] text-white border-4 border-black py-4 rounded-2xl font-display text-lg uppercase tracking-wider font-extrabold shadow-[4px_4px_0px_#1c1b1b] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1c1b1b] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : isSignUp ? (
              <>
                <UserPlus size={18} />
                Create Account
              </>
            ) : (
              <>
                <LogIn size={18} />
                Authenticate
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setUser({ id: 'default_user', email: 'guest@vibeup.com' })
            setActivePage('portfolio')
          }}
          className="w-full mt-4 bg-[#00d09c] text-black border-4 border-black py-3 rounded-2xl font-display text-base uppercase tracking-wider font-extrabold shadow-[4px_4px_0px_#1c1b1b] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1c1b1b] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          🚀 Enter as Guest (Bypass Auth)
        </button>
      </motion.div>
    </div>
  )
}

export default Auth
