import axios from 'axios'

let rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
if (rawApiUrl && !rawApiUrl.startsWith('http://') && !rawApiUrl.startsWith('https://')) {
  rawApiUrl = 'https://' + rawApiUrl
}
const API_BASE_URL = rawApiUrl.replace(/\/$/, '') + '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

import { supabase } from './supabase'

// Request interceptor (can be used for adding headers like auth tokens)
api.interceptors.request.use(
  async (config) => {
    try {
      if (supabase && supabase.auth) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session && session.access_token) {
          config.headers['Authorization'] = `Bearer ${session.access_token}`
        }
      }
    } catch (err) {
      console.warn('Could not attach auth header:', err)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default api
export { api }
