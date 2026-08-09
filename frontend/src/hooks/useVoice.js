import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'

export function useVoice({ onResult, language = 'en-IN', voiceStyle = 'energetic' }) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [supportSpeech, setSupportSpeech] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  
  const recognitionRef = useRef(null)
  const audioRef = useRef(null)
  const onResultRef = useRef(onResult)

  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  useEffect(() => {
    // Check Speech Recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setSupportSpeech(true)
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.interimResults = true
      rec.lang = language

      rec.onstart = () => {
        setIsListening(true)
        setTranscript('')
      }

      rec.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }

        if (finalTranscript) {
          setTranscript(finalTranscript)
          if (onResultRef.current) {
            onResultRef.current(finalTranscript)
          }
        } else if (interimTranscript) {
          setTranscript(interimTranscript)
        }
      }

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e)
        setIsListening(false)
      }

      rec.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = rec
    } else {
      console.warn('Speech Recognition not supported in this browser.')
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [language])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
      } catch (err) {
        console.error('Start listening error:', err)
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  // Speak function utilizing ElevenLabs with a solid SpeechSynthesis local fallback
  const speak = async (text) => {
    // 1. Stop any currently playing audio
    cancelSpeech()

    // Clean text of markdown characters before speaking
    const cleanText = text.replace(/[*#_`\[\]()\-]/g, ' ')

    // 2. Try ElevenLabs API via Backend
    try {
      const response = await api.post('/voice/tts', { text: cleanText }, { responseType: 'blob' })

      if (response.data) {
        const audioBlob = new Blob([response.data], { type: 'audio/mpeg' })
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        audioRef.current = audio
        audio.onplay = () => setIsPlaying(true)
        audio.onended = () => {
          setIsPlaying(false)
          URL.revokeObjectURL(audioUrl)
        }
        audio.onerror = () => {
          setIsPlaying(false)
          URL.revokeObjectURL(audioUrl)
        }
        audio.play()
        return
      }
    } catch (err) {
      console.warn('ElevenLabs API unavailable, activating local SpeechSynthesis fallback...', err)
    }

    // 3. Fallback to browser HTML5 SpeechSynthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel() // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.lang = language
      utterance.rate = 1.05
      
      // Try to find an Indian English or corresponding voice
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(v => v.lang.startsWith(language.split('-')[0]))
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onstart = () => setIsPlaying(true)
      utterance.onend = () => setIsPlaying(false)
      utterance.onerror = () => setIsPlaying(false)
      
      window.speechSynthesis.speak(utterance)
    } else {
      console.warn('HTML5 speech synthesis not supported.')
    }
  }

  const cancelSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsPlaying(false)
  }

  return { 
    startListening, 
    stopListening, 
    speak, 
    cancelSpeech,
    transcript, 
    isListening,
    supportSpeech,
    isPlaying
  }
}

export default useVoice
