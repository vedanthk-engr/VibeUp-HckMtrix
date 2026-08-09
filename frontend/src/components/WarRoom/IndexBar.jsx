import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useVibeStore } from '../../store/vibeStore'

export function IndexBar() {
  const { isSidebarCollapsed } = useVibeStore()
  const [indices, setIndices] = useState([
    { name: 'NIFTY 50', value: 24236.25, change: -0.02 },
    { name: 'SENSEX', value: 77653.81, change: -0.01 },
    { name: 'BANK NIFTY', value: 56953.35, change: -0.42 },
    { name: 'NIFTY IT', value: 31260.60, change: 0.67 },
    { name: 'INDIA VIX', value: 18.53, change: -1.17 },
    { name: 'USDINR', value: 95.71, change: 0.07 }
  ])

  useEffect(() => {
    const isMarketHours = () => {
      const now = new Date()
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
      const ist = new Date(utc + (3600000 * 5.5))
      const day = ist.getDay()
      if (day === 0 || day === 6) return false
      const mins = ist.getHours() * 60 + ist.getMinutes()
      return mins >= 9 * 60 + 15 && mins <= 15 * 60 + 30
    }

    const fetchIndices = async () => {
      try {
        const response = await api.get('/market/indices')
        if (response.data && response.data.length > 0) {
          setIndices(prev => {
            const apiMap = new Map(response.data.map(item => [item.name, item]))
            return prev.map(oldItem => apiMap.get(oldItem.name) || oldItem)
          })
        }
      } catch (err) {
        console.warn('Failed to poll indices, using cache data:', err)
      }
    }
    fetchIndices()

    // Poll every 15s during market hours, every 5 min otherwise
    const pollInterval = isMarketHours() ? 15000 : 300000
    const interval = setInterval(fetchIndices, pollInterval)
    return () => clearInterval(interval)
  }, [])

  // Multiply 6-item array by 6 to guarantee a dense 36-item infinite seamless marquee loop with zero blank space
  const listItems = [...indices, ...indices, ...indices, ...indices, ...indices, ...indices]

  return (
    <div className={`fixed top-0 z-50 overflow-hidden border-b-3 border-[#1c1b1b] bg-[#1c1b1b] py-2 text-white transition-all duration-300 left-0 w-full ${
      isSidebarCollapsed ? 'md:left-20 md:w-[calc(100%-5rem)]' : 'md:left-64 md:w-[calc(100%-16rem)]'
    }`}>
      <div className="flex whitespace-nowrap animate-marquee">
        {listItems.map((idx, index) => {
          const isPositive = idx.change >= 0
          return (
            <span key={index} className="inline-flex items-center mx-8 font-mono text-sm font-semibold select-none">
              <span className="text-zinc-400 mr-2 uppercase">{idx.name}</span>
              <span className="text-white mr-2">{idx.value.toLocaleString('en-IN')}</span>
              <span className={isPositive ? 'text-pink-400 font-bold' : 'text-sky-300 font-bold'}>
                {isPositive ? '↑' : '↓'} {Math.abs(idx.change).toFixed(2)}%
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default IndexBar

