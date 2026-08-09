import React, { useEffect, useRef, useState } from 'react'
import { createChart, CandlestickSeries, HistogramSeries, LineSeries, AreaSeries } from 'lightweight-charts'
import { api } from '../../lib/api'
import { Search, Loader2, Info } from 'lucide-react'
import { useVibeStore } from '../../store/vibeStore'

export function CandlestickChart({ defaultSymbol = 'ZOMATO', onSymbolChange }) {
  const { riskArchetype } = useVibeStore()
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const volumeSeriesRef = useRef(null)
  const ma20SeriesRef = useRef(null)
  const ma50SeriesRef = useRef(null)

  const [symbol, setSymbol] = useState(defaultSymbol)
  const [searchInput, setSearchInput] = useState('')
  const [timeframe, setTimeframe] = useState('3M') // 1D, 1W, 1M, 3M, 1Y
  const [showMA20, setShowMA20] = useState(true)
  const [showMA50, setShowMA50] = useState(false)
  const [chartType, setChartType] = useState('candles') // candles / area
  const [loading, setLoading] = useState(false)
  const [quoteInfo, setQuoteInfo] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [marketStatusMsg, setMarketStatusMsg] = useState('')
  const mainSeriesRef = useRef(null)

  useEffect(() => {
    setSymbol(defaultSymbol)
  }, [defaultSymbol])

  const ARCHETYPE_STOCKS = {
    'Slow Builder': ['RELIANCE', 'HDFCBANK', 'INFY', 'TITAN', 'TCS'],
    'Optimizer': ['HAL', 'TATASTEEL', 'LT', 'COALINDIA', 'RELIANCE'],
    'FOMO Trader': ['ZOMATO', 'TATAELXSI', 'JIOFIN', 'TITAN', 'HAL'],
    'Thrill Chaser': ['SUZLON', 'IREDA', 'TRENT', 'ZOMATO', 'TATASTEEL']
  }

  // Preselected stocks based on archetype
  const trendingStocks = ARCHETYPE_STOCKS[riskArchetype] || ['ZOMATO', 'TITAN', 'RELIANCE', 'TATASTEEL', 'HAL']

  // Fetch quotes
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await api.get(`/market/quote/${symbol}`)
        if (response.data) {
          setQuoteInfo(response.data)
        }
      } catch (err) {
        console.warn('Quote fetch failed:', err)
      }
    }
    fetchQuote()
  }, [symbol])

  // Helper: compute SMA
  const calculateSMA = (data, count) => {
    const avg = []
    for (let i = 0; i < data.length; i++) {
      if (i < count - 1) {
        continue
      }
      let sum = 0
      for (let j = 0; j < count; j++) {
        sum += data[i - j].close
      }
      avg.push({
        time: data[i].time,
        value: sum / count
      })
    }
    return avg
  }

  // Load chart data
  useEffect(() => {
    if (!chartContainerRef.current) return

    setLoading(true)
    setErrorMsg('')

    // Reset chart container html
    chartContainerRef.current.innerHTML = ''
    
    // Create Chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#ffffff' },
        textColor: '#1c1b1b',
      },
      grid: {
        vertLines: { color: '#f0eded' },
        horzLines: { color: '#f0eded' },
      },
      crosshair: {
        mode: 1, // CrosshairMode.Normal
      },
      rightPriceScale: {
        borderColor: '#1c1b1b',
      },
      timeScale: {
        borderColor: '#1c1b1b',
        timeVisible: timeframe === '1D',
      },
      width: chartContainerRef.current.clientWidth,
      height: 320,
    })
    
    chartRef.current = chart

    // Add Series
    let mainSeries
    if (chartType === 'candles') {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#1c1b1b',
        borderDownColor: '#1c1b1b',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      })
    } else {
      mainSeries = chart.addSeries(AreaSeries, {
        lineColor: '#630ed4',
        topColor: 'rgba(99, 14, 212, 0.3)',
        bottomColor: 'rgba(99, 14, 212, 0.0)',
        lineWidth: 3,
      })
    }
    mainSeriesRef.current = mainSeries

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#7c3aed',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // overlay
    })
    volumeSeriesRef.current = volumeSeries
    
    // Volume pane sizing
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    })

    const isMarketOpen = () => {
      const now = new Date()
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
      const ist = new Date(utc + (3600000 * 5.5))
      const day = ist.getDay()
      const hours = ist.getHours()
      const minutes = ist.getMinutes()
      if (day === 0 || day === 6) return false
      const timeInMinutes = hours * 60 + minutes
      const marketStart = 9 * 60 + 15
      const marketEnd = 15 * 60 + 30
      return timeInMinutes >= marketStart && timeInMinutes <= marketEnd
    }

    const fetchChartData = async () => {
      try {
        let response
        let isFallbackToHistorical = false
        let is1DTimeframe = timeframe === '1D'

        if (is1DTimeframe) {
          try {
            response = await api.get(`/market/intraday/${symbol}`)
            if (!response.data || response.data.length === 0) {
              throw new Error('Empty intraday data')
            }
          } catch (err) {
            console.warn('Failed to fetch intraday data, falling back to historical daily data:', err)
            response = await api.get(`/market/historical/${symbol}?period=1mo`)
            isFallbackToHistorical = true
          }
        } else {
          let period = '1y'
          if (timeframe === '1W') period = '5d'
          if (timeframe === '1M') period = '1mo'
          if (timeframe === '3M') period = '3mo'
          if (timeframe === '1Y') period = '1y'
          
          response = await api.get(`/market/historical/${symbol}?period=${period}`)
        }

        const data = response.data
        if (!data || data.length === 0) {
          setErrorMsg('No trading data available for this ticker.')
          setLoading(false)
          return
        }

        // Format data
        const candles = data.map(item => {
          let timeVal = item.time
          if (is1DTimeframe && !isFallbackToHistorical) {
            const normalizedTime = typeof item.time === 'string' ? item.time.replace(' ', 'T') : item.time
            const parsed = new Date(normalizedTime).getTime()
            timeVal = isNaN(parsed) ? Math.floor(Date.now() / 1000) : Math.floor(parsed / 1000)
          }
          return {
            time: timeVal,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close
          }
        })

        const volumes = data.map(item => {
          let timeVal = item.time
          if (is1DTimeframe && !isFallbackToHistorical) {
            const normalizedTime = typeof item.time === 'string' ? item.time.replace(' ', 'T') : item.time
            const parsed = new Date(normalizedTime).getTime()
            timeVal = isNaN(parsed) ? Math.floor(Date.now() / 1000) : Math.floor(parsed / 1000)
          }
          return {
            time: timeVal,
            value: item.volume,
            color: item.close >= item.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
          }
        })

        if (chartType === 'candles') {
          mainSeries.setData(candles)
        } else {
          const areaData = candles.map(c => ({ time: c.time, value: c.close }))
          mainSeries.setData(areaData)
        }
        volumeSeries.setData(volumes)

        // Moving Averages
        if (showMA20 && candles.length >= 20) {
          const ma20Data = calculateSMA(candles, 20)
          const ma20Series = chart.addSeries(LineSeries, {
            color: '#630ed4', // deep violet
            lineWidth: 3,
            title: 'MA20'
          })
          ma20Series.setData(ma20Data)
          ma20SeriesRef.current = ma20Series
        }

        if (showMA50 && candles.length >= 50) {
          const ma50Data = calculateSMA(candles, 50)
          const ma50Series = chart.addSeries(LineSeries, {
            color: '#fd56a7', // hot pink
            lineWidth: 3,
            title: 'MA50'
          })
          ma50Series.setData(ma50Data)
          ma50SeriesRef.current = ma50Series
        }

        // Set status message
        if (isFallbackToHistorical) {
          setMarketStatusMsg('Market is closed. Showing daily historical trend.')
        } else if (!isMarketOpen()) {
          setMarketStatusMsg('Market is closed. Showing last updated session data.')
        } else {
          setMarketStatusMsg('')
        }

        chart.timeScale().fitContent()
        setLoading(false)
      } catch (err) {
        console.error(err)
        setErrorMsg('NSE quote index is closed or symbol is invalid.')
        setLoading(false)
      }
    }

    fetchChartData()

    // Resize Handler
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.resize(chartContainerRef.current.clientWidth, 320)
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [symbol, timeframe, showMA20, showMA50, chartType])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      const target = searchInput.trim().toUpperCase()
      setSymbol(target)
      if (onSymbolChange) onSymbolChange(target)
    }
  }

  const handleStockClick = (stk) => {
    setSymbol(stk)
    if (onSymbolChange) onSymbolChange(stk)
  }

  return (
    <div className="bg-white border-4 border-[#1c1b1b] rounded-3xl p-6 relative w-full overflow-visible shadow-[8px_8px_0px_#1c1b1b] transform -rotate-1">
      {/* Quote Display and Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b-3 border-[#f0eded] pb-4">
        
        {/* Quote */}
        <div className="text-left">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-2xl font-bold font-display text-[#1c1b1b]">{symbol}</h2>
            <span className="text-[10px] font-black bg-white border-2 border-black px-2 py-0.5 rounded-md shadow-[2px_2px_0px_#1c1b1b]">NSE</span>
            <span className="text-[9px] font-black bg-[#fde047] border-2 border-black px-2 py-1 rounded-md shadow-[2px_2px_0px_#1c1b1b] uppercase tracking-wider transform rotate-1 select-none">
              Breakout zone 🔥
            </span>
          </div>
          {quoteInfo && (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold font-mono text-[#1c1b1b]">₹{quoteInfo.price.toFixed(2)}</span>
              <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded border border-black ${quoteInfo.change >= 0 ? 'bg-[#c8e6c9] text-[#2e7d32]' : 'bg-[#ffcdd2] text-[#c62828]'}`}>
                {quoteInfo.change >= 0 ? '+' : ''}{quoteInfo.change.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <input
              type="text"
              placeholder="Search ticker (e.g. INFY)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full md:w-56 bg-white border-3 border-black rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-black focus:outline-none focus:ring-0"
            />
            <Search size={14} className="absolute left-3 top-3.5 text-zinc-500" />
          </div>
          <button 
            type="submit" 
            className="chunky-btn bg-[#fde047] hover:bg-yellow-300 text-xs px-4 py-2"
          >
            Go
          </button>
        </form>
      </div>

      {/* Quick Picks */}
      <div className="flex flex-wrap items-center gap-2 mb-4 justify-start">
        <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mr-2">Quick:</span>
        {trendingStocks.map((stk) => (
          <button
            key={stk}
            onClick={() => handleStockClick(stk)}
            className={`
              text-[10px] px-3 py-1.5 rounded-full border-2 border-black font-semibold font-display transition-all cursor-pointer shadow-[2px_2px_0px_#1c1b1b]
              ${symbol === stk 
                ? 'bg-[#fd56a7] text-black font-bold' 
                : 'bg-white text-zinc-600 hover:bg-zinc-50'
              }
            `}
          >
            {stk}
          </button>
        ))}
      </div>

      {/* Market Status Banner */}
      {marketStatusMsg && (
        <div className="bg-[#fde047] border-3 border-black rounded-2xl px-4 py-3 mb-4 flex items-center gap-2 shadow-[4px_4px_0px_#1c1b1b]">
          <Info size={16} className="text-black shrink-0" />
          <span className="text-[10px] font-black text-black uppercase tracking-wider">
            {marketStatusMsg}
          </span>
        </div>
      )}

      {/* Chart Control Bar */}
      <div className="flex flex-wrap justify-between items-center bg-[#f6f3f2] border-3 border-black rounded-xl px-4 py-2 mb-4 gap-3">
        {/* Timeframes */}
        <div className="flex gap-2 items-center">
          {['1D', '1W', '1M', '3M', '1Y'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`
                text-[10px] font-bold px-3 py-1 rounded-full border transition-all cursor-pointer
                ${timeframe === tf 
                  ? 'bg-[#fd56a7] text-white border-2 border-black shadow-[2px_2px_0px_#1c1b1b] transform -rotate-2' 
                  : 'bg-white text-zinc-600 border-2 border-black shadow-[2px_2px_0px_#1c1b1b] hover:bg-zinc-50'
                }
              `}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart Style Toggle Options */}
        <div className="flex gap-1 bg-white border-2 border-black rounded-lg p-0.5 shadow-[2px_2px_0px_#1c1b1b] transform -rotate-1">
          {['candles', 'area'].map((style) => (
            <button
              key={style}
              onClick={() => setChartType(style)}
              className={`
                text-[9px] font-black px-2.5 py-1 rounded-md transition-all cursor-pointer uppercase
                ${chartType === style 
                  ? 'bg-[#1c1b1b] text-white' 
                  : 'text-zinc-600 hover:text-black hover:bg-zinc-50'
                }
              `}
            >
              {style === 'candles' ? 'Candles 🕯️' : 'Area 📈'}
            </button>
          ))}
        </div>

        {/* MA Toggles */}
        <div className="flex items-center gap-4 text-[10px] font-bold">
          <label className="flex items-center gap-1.5 text-[#630ed4] cursor-pointer">
            <input 
              type="checkbox" 
              checked={showMA20} 
              onChange={() => setShowMA20(!showMA20)}
              className="rounded border-2 border-black text-[#630ed4] focus:ring-0 cursor-pointer"
            />
            <span>MA20</span>
          </label>
          <label className="flex items-center gap-1.5 text-[#fd56a7] cursor-pointer">
            <input 
              type="checkbox" 
              checked={showMA50} 
              onChange={() => setShowMA50(!showMA50)}
              className="rounded border-2 border-black text-[#fd56a7] focus:ring-0 cursor-pointer"
            />
            <span>MA50</span>
          </label>
        </div>
      </div>

      {/* Canvas Wrapper */}
      <div className="relative w-full h-80 rounded-2xl overflow-hidden border-3 border-black bg-white">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20 gap-2">
            <Loader2 className="animate-spin text-[#630ed4]" size={18} />
            <span className="text-black text-xs font-bold font-display">Tuning telemetry...</span>
          </div>
        )}
        
        {errorMsg ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20 px-6 text-center">
            <div className="bg-[#fde047] w-14 h-14 rounded-full flex items-center justify-center border-3 border-black shadow-[3px_3px_0px_#1c1b1b] mb-4">
              <Info className="text-black" size={24} />
            </div>
            <p className="text-sm font-black text-black max-w-xs leading-relaxed font-display uppercase mb-2">
              {errorMsg}
            </p>
            <p className="text-[10px] text-zinc-500 font-bold mb-4">
              NSE markets trade Mon–Fri, 9:15 AM – 3:30 PM IST.
              <br/>Data will load automatically when markets open.
            </p>
            <button 
              onClick={() => { setErrorMsg(''); setTimeframe(timeframe === '3M' ? '1M' : '3M'); }}
              className="text-[10px] font-black px-4 py-2 rounded-full border-2 border-black bg-white text-black shadow-[2px_2px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-[0px_0px_0px_#1c1b1b] transition-all cursor-pointer hover:bg-zinc-50"
            >
              Retry with different timeframe ↻
            </button>
          </div>
        ) : null}

        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  )
}

export default CandlestickChart

