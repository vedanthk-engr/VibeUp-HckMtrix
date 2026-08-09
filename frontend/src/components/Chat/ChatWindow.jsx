import React, { useEffect, useRef, useState } from 'react'
import { api } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { useVibeStore } from '../../store/vibeStore'
import { useVoice } from '../../hooks/useVoice'
import { QuickChips } from './QuickChips'
import { VoiceButton } from './VoiceButton'
import { GlassCard } from '../shared/GlassCard'
import ModelBadge from '../shared/ModelBadge'
import { Send, Bot, User, HelpCircle, Loader2, Paperclip, X, Volume2 } from 'lucide-react'

export function ChatWindow() {
  const { riskArchetype, vibeSelections, holdings, setActivePage, language, voiceStyle } = useVibeStore()
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeSpeech, setActiveSpeech] = useState('')
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null)

  // PDF uploading states
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [pdfMetadata, setPdfMetadata] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const handlePdfUpload = async (file) => {
    setUploadingPdf(true)
    setPdfMetadata(null)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('ticker', '')
    formData.append('source', file.name)
    try {
      const response = await api.post('/rag/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (response.data && response.data.status === 'success') {
        setPdfMetadata(response.data.metadata)
      }
    } catch (err) {
      console.error("PDF upload failed:", err)
    } finally {
      setUploadingPdf(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      handlePdfUpload(file)
    } else {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage({
          base64: reader.result.split(',')[1],
          type: file.type,
          name: file.name,
          preview: reader.result
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        handlePdfUpload(file)
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setSelectedImage({
            base64: reader.result.split(',')[1],
            type: file.type,
            name: file.name,
            preview: reader.result
          })
        }
        reader.readAsDataURL(file)
      }
    }
  }

  // Voice engine hook
  const { startListening, stopListening, speak, cancelSpeech, transcript, isListening, isPlaying } = useVoice({
    language,
    voiceStyle,
    onResult: (text) => {
      handleSendText(text)
    }
  })

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Reset speaker button when playback completes
  useEffect(() => {
    if (!isPlaying) {
      setSpeakingMessageIndex(null)
    }
  }, [isPlaying])

  const getMessageText = (content) => {
    if (typeof content === 'string') return content
    if (Array.isArray(content)) {
      return content
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join(' ')
    }
    return ''
  }

  const handleToggleSpeak = (index) => {
    if (speakingMessageIndex === index) {
      cancelSpeech()
      setSpeakingMessageIndex(null)
    } else {
      cancelSpeech()
      const text = getMessageText(messages[index].content)
      if (text) {
        setSpeakingMessageIndex(index)
        speak(text)
      }
    }
  }

  // Map holdings to simple summary string for system prompt context
  const holdingsSummary = holdings.map(h => `${h.ticker} (${h.quantity} shares)`).join(', ') || 'No holdings yet'

  const handleSendText = async (text, image = null) => {
    if (!text.trim()) return

    const userContent = image 
      ? [
          { type: 'text', text: text },
          { 
            type: 'image', 
            source: { 
              type: 'base64', 
              media_type: image.type, 
              data: image.base64 
            } 
          }
        ]
      : text;

    const newMsg = { role: 'user', content: userContent }
    const updatedMessages = [...messages, newMsg]
    setMessages(updatedMessages)
    setInputText('')
    setSelectedImage(null)
    setLoading(true)
    cancelSpeech()

    try {
      // Build context
      const userCtx = {
        risk_archetype: riskArchetype,
        vibe_selections: vibeSelections.join(', '),
        portfolio_summary: holdingsSummary
      }

      // Stream from FastAPI chat endpoint
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          user_context: userCtx
        })
      })

      if (!response.body) {
        throw new Error('Streaming response body not supported')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      const assistantMsg = { role: 'assistant', content: '' }
      setMessages(prev => [...prev, assistantMsg])
      
      let fullContent = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim()
            if (dataStr === '[DONE]') {
              break
            }
            try {
              const dataObj = JSON.parse(dataStr)
              if (dataObj.text) {
                fullContent += dataObj.text
                setMessages(prev => {
                  const copy = [...prev]
                  copy[copy.length - 1].content = fullContent
                  return copy
                })
              }
            } catch (err) {
              // Ignore parse errors from partial JSON packets
            }
          }
        }
      }
      
      // Auto-speak Gemma 4's response if fullContent is available
      if (fullContent.trim()) {
        setActiveSpeech(fullContent)
        speak(fullContent)
      }

      // Save messages in Supabase
      try {
        await supabase.from('chat_messages').insert([
          { role: 'user', content: text },
          { role: 'assistant', content: fullContent }
        ])
      } catch (dbErr) {
        console.warn('Failed to persist chat messages in DB:', dbErr)
      }

    } catch (err) {
      console.error(err)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Yo, I hit a slight connection glitch. But we keep grinding. Try asking again!' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleInputSubmit = (e) => {
    e.preventDefault()
    handleSendText(inputText, selectedImage)
  }

  // Intercept and parse tickers as clickable buttons
  const parseMessageText = (content) => {
    // Basic markdown bold parser
    const boldRegex = /\*\*(.*?)\*\*/g
    const bulletRegex = /^\s*-\s+(.*)$/gm
    
    let parsedHTML = content
      .replace(boldRegex, '<strong class="font-bold text-white">$1</strong>')
      .replace(bulletRegex, '<li class="list-disc ml-4 mt-1 text-zinc-300">$1</li>')

    // Find upper-case symbols like ZOMATO, TITAN, INFY
    const tickerRegex = /\b(ZOMATO|TITAN|RELIANCE|TATASTEEL|HAL|INFY|TCS|PAYTM)\b/g
    
    // Split text by ticker matches to inject React components safely instead of raw HTML
    const parts = []
    let lastIndex = 0
    let match
    
    // We will do a simple string splitter for tickers
    const textToScan = content
    const symbols = ['ZOMATO', 'TITAN', 'RELIANCE', 'TATASTEEL', 'HAL', 'INFY', 'TCS', 'PAYTM']
    
    // Regex for matching any of these specific symbols
    const combinedRegex = new RegExp(`\\b(${symbols.join('|')})\\b`, 'g')
    
    let keyIndex = 0
    while ((match = combinedRegex.exec(textToScan)) !== null) {
      const matchIndex = match.index
      const matchText = match[0]
      
      // Add text before match
      if (matchIndex > lastIndex) {
        parts.push(<span key={keyIndex++}>{textToScan.substring(lastIndex, matchIndex)}</span>)
      }
      
      // Add ticker button
      parts.push(
        <button
          key={keyIndex++}
          onClick={() => setActivePage('warroom')}
          className="px-1.5 py-0.2 mx-1 rounded bg-violet-600/20 hover:bg-violet-600/35 border border-violet-500/30 text-violet-400 font-bold font-mono text-[10px] tracking-wider select-none shrink-0"
        >
          {matchText}
        </button>
      )
      
      lastIndex = combinedRegex.lastIndex
    }
    
    if (lastIndex < textToScan.length) {
      parts.push(<span key={keyIndex++}>{textToScan.substring(lastIndex)}</span>)
    }

    return parts.length > 0 ? parts : [content]
  }

  const renderMessageContent = (msg) => {
    const isUser = msg.role === 'user'
    if (typeof msg.content === 'string') {
      return isUser ? msg.content : parseMessageText(msg.content)
    }
    if (Array.isArray(msg.content)) {
      return msg.content.map((part, index) => {
        if (part.type === 'text') {
          return (
            <div key={index} className="mb-2 last:mb-0">
              {isUser ? part.text : parseMessageText(part.text)}
            </div>
          )
        }
        if (part.type === 'image') {
          const imgSrc = part.source?.data.startsWith('data:') 
            ? part.source.data 
            : `data:${part.source?.media_type || 'image/png'};base64,${part.source?.data}`
          return (
            <div key={index} className="mt-2 mb-2 max-w-full overflow-hidden rounded-lg border-2 border-black">
              <img src={imgSrc} alt="User attachment" className="w-full h-auto object-cover max-h-48" />
            </div>
          )
        }
        return null
      })
    }
    return null
  }

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col h-[calc(100vh-220px)] w-full max-w-3xl mx-auto bg-white border-3 border-black rounded-3xl relative overflow-hidden transform rotate-[0.5deg] shadow-[6px_6px_0px_0px_#1c1b1b]"
    >
      {/* Background patterns */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-5 select-none doodle-bg" />

      {/* Header */}
      <div className="flex justify-between items-center border-b-3 border-black px-6 py-4 bg-bg-cream z-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-rainbow-2 text-white flex items-center justify-center font-bold font-display border-2 border-black shadow-[2px_2px_0px_0px_#1c1b1b]">
            C
          </div>
          <div className="text-left">
            <h2 className="text-xs font-black font-display text-black tracking-wide">CO-PILOT</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse border border-black" />
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Co-pilot online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages view list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center space-y-4 px-6 py-10">
            <div className="w-16 h-16 rounded-full bg-rainbow-4 flex items-center justify-center border-3 border-black shadow-[3px_3px_0px_0px_#1c1b1b] animate-bounce">
              <Bot size={28} className="text-black" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-black uppercase">Ask Co-pilot Anything</h3>
              <p className="text-xs text-zinc-500 max-w-xs mt-1 leading-relaxed">
                Analyze stock filings, calculate compounding projections, compare tickers, or ask for general market telemetry.
              </p>
            </div>
            {/* Quick Suggestions */}
            <QuickChips onSelectChip={handleSendText} />
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user'
              return (
                <div 
                  key={i} 
                  className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shrink-0 border-2 border-black shadow-[2px_2px_0px_0px_#1c1b1b]">
                      <Bot size={14} className="text-black" />
                    </div>
                  )}
                  <div 
                    className={`
                      max-w-[80%] rounded-2xl p-4 text-xs font-bold leading-relaxed text-left border-3 border-black shadow-[4px_4px_0px_0px_#1c1b1b]
                      ${isUser 
                        ? 'bg-black text-white rounded-tr-none shadow-[#fd56a7]' 
                        : 'bg-bg-cream text-bg-darker rounded-tl-none'
                      }
                    `}
                  >
                    <div className="whitespace-pre-wrap">
                      {renderMessageContent(msg)}
                    </div>
                    {!isUser && (
                      <div className="mt-3 pt-2 border-t-2 border-black/10 flex justify-between items-center">
                        <ModelBadge model={msg.model || "gemma"} />
                        {getMessageText(msg.content).trim() && (
                          <button
                            type="button"
                            onClick={() => handleToggleSpeak(i)}
                            className={`
                              px-2.5 py-1 rounded-lg border-2 border-black flex items-center gap-1.5 cursor-pointer transition-all text-[9px] font-black uppercase tracking-wider
                              ${speakingMessageIndex === i 
                                ? 'bg-rainbow-3 text-black shadow-[1px_1px_0px_#000] translate-y-0.5' 
                                : 'bg-white text-black hover:bg-zinc-100 shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-[1px_1px_0px_#000]'
                              }
                            `}
                            title={speakingMessageIndex === i ? 'Stop Listening' : 'Listen to message'}
                          >
                            <Volume2 size={10} className={speakingMessageIndex === i ? 'animate-bounce' : ''} />
                            <span>{speakingMessageIndex === i ? 'Speaking...' : 'Listen'}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {isUser && (
                    <div className="h-8 w-8 rounded-full bg-rainbow-3 border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#1c1b1b]">
                      <User size={14} className="text-black" />
                    </div>
                  )}
                </div>
              )
            })}
            {loading && (
              <div className="flex items-center gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-[#fde047] border-2 border-black flex items-center justify-center shrink-0 animate-spin">
                  <Loader2 className="text-black" size={14} />
                </div>
                <div className="bg-bg-cream border-3 border-black rounded-2xl rounded-tl-none p-3.5 text-[10px] font-bold text-zinc-600 shadow-[2px_2px_0px_0px_#1c1b1b]">
                  Co-pilot is analyzing market filings...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Image Attachment Preview */}
      {selectedImage && (
        <div className="px-6 py-2 bg-white border-t-3 border-black flex items-center justify-between z-20 relative">
          <div className="flex items-center gap-3">
            <img src={selectedImage.preview} alt="Attachment Preview" className="h-10 w-10 object-cover rounded border-2 border-black" />
            <span className="text-[10px] font-bold text-zinc-500 truncate max-w-[180px]">{selectedImage.name}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSelectedImage(null)}
            className="p-1 rounded-full border border-black hover:bg-red-50 text-red-500 bg-white shadow-[1px_1px_0px_#1c1b1b] cursor-pointer"
          >
            <X size={10} className="stroke-[3]" />
          </button>
        </div>
      )}

      {/* PDF Upload In Progress */}
      {uploadingPdf && (
        <div className="px-6 py-3 bg-[#eaddff] border-t-3 border-black flex items-center justify-between z-20 relative">
          <div className="flex items-center gap-3 w-full">
            <Loader2 className="animate-spin text-[#7c3aed] shrink-0" size={16} />
            <div className="flex-1 text-left">
              <span className="text-[10px] font-black uppercase text-zinc-600 tracking-wider">Parsing SEBI Disclosure...</span>
              <div className="w-full h-2.5 bg-white border-2 border-black rounded-full overflow-hidden mt-1 relative">
                <div className="h-full bg-[#7c3aed] border-r border-black animate-[pulse_1.5s_infinite]" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Metadata Chip */}
      {pdfMetadata && (
        <div className="px-6 py-2.5 bg-emerald-100 border-t-3 border-black flex items-center justify-between z-20 relative">
          <div className="flex items-center gap-2">
            <span className="text-sm">📄</span>
            <div className="text-left">
              <span className="text-[10px] font-black text-black uppercase truncate max-w-[200px] block leading-none">{pdfMetadata.source}</span>
              <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider">{pdfMetadata.page_count} pages • {pdfMetadata.char_count} chars ingested</span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setPdfMetadata(null)}
            className="p-1 rounded-full border border-black hover:bg-red-50 text-red-500 bg-white shadow-[1px_1px_0px_#1c1b1b] cursor-pointer"
          >
            <X size={10} className="stroke-[3]" />
          </button>
        </div>
      )}

      {/* Drag Over Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-[#7c3aed]/20 backdrop-blur-sm border-6 border-dashed border-black z-30 flex flex-col items-center justify-center pointer-events-none">
          <div className="bg-white border-4 border-black p-6 rounded-3xl shadow-[6px_6px_0px_0px_#000] text-center max-w-sm pointer-events-none">
            <Bot size={48} className="mx-auto mb-3 text-[#7c3aed] animate-bounce" />
            <h3 className="text-lg font-black font-display uppercase">Drop SEBI Filing / Report PDF</h3>
            <p className="text-xs text-zinc-500 font-bold mt-1">Chunk and index document into Aurex AI vector memory</p>
          </div>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleInputSubmit} className="border-t-3 border-black p-4 bg-bg-cream flex items-center gap-3 relative z-20">
        <VoiceButton 
          isListening={isListening} 
          startListening={startListening} 
          stopListening={stopListening} 
          activeTranscript={transcript} 
          isSpeaking={isPlaying}
          speakText={activeSpeech}
        />

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center h-11 w-11 rounded-xl bg-white border-3 border-black text-black hover:bg-zinc-50 shadow-[3px_3px_0px_0px_#1c1b1b] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_#1c1b1b] transition-all cursor-pointer shrink-0"
          title="Attach Image"
        >
          <Paperclip size={16} className="stroke-[3]" />
        </button>

        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,.pdf"
          className="hidden"
        />

        <input
          type="text"
          placeholder="Ask Co-pilot: Why is Nifty moving? or Analyze Zomato..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          className="flex-1 bg-white border-3 border-black rounded-xl py-3 px-4 text-xs text-black font-bold placeholder-zinc-400 focus:outline-none focus:border-rainbow-2 disabled:opacity-40 shadow-[3px_3px_0px_0px_#1c1b1b]"
        />

        <button
          type="submit"
          disabled={(!inputText.trim() && !selectedImage) || loading}
          className="
            flex items-center justify-center h-11 w-11 rounded-xl bg-black border-3 border-black text-white hover:bg-rainbow-2 disabled:opacity-40 cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-[3px_3px_0px_0px_rgba(28,27,27,0.5)] shrink-0
          "
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}

export default ChatWindow

