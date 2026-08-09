import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL') {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing. Initializing Mock Supabase client.')
  
  // Custom mock database handler using localStorage
  const getStorage = (key) => JSON.parse(localStorage.getItem(key) || '[]')
  const setStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data))
  
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: 'mock-user-123', email: 'genz_investor@vibeup.com' } } }, error: null }),
      onAuthStateChange: (callback) => {
        // Trigger login state
        callback('SIGNED_IN', { user: { id: 'mock-user-123', email: 'genz_investor@vibeup.com' } })
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
      signInWithPassword: async ({ email }) => ({ data: { user: { id: 'mock-user-123', email } }, error: null }),
      signUp: async ({ email }) => ({ data: { user: { id: 'mock-user-123', email } }, error: null }),
      signOut: async () => ({ error: null })
    },
    from: (table) => {
      return {
        select: (query = '*') => {
          return {
            eq: (col, val) => {
              return {
                order: () => {
                  return {
                    execute: async () => {
                      let data = getStorage(table)
                      data = data.filter(item => item[col] === val)
                      return { data, error: null }
                    },
                    then: (onfulfilled) => {
                      let data = getStorage(table)
                      data = data.filter(item => item[col] === val)
                      return Promise.resolve(onfulfilled({ data, error: null }))
                    }
                  }
                },
                execute: async () => {
                  let data = getStorage(table)
                  data = data.filter(item => item[col] === val)
                  return { data, error: null }
                },
                then: (onfulfilled) => {
                  let data = getStorage(table)
                  data = data.filter(item => item[col] === val)
                  return Promise.resolve(onfulfilled({ data, error: null }))
                }
              }
            },
            execute: async () => {
              let data = getStorage(table)
              // Seed initial holdings if empty
              if (table === 'holdings' && data.length === 0) {
                data = [
                  { id: '1', user_id: 'mock-user-123', ticker: 'ZOMATO', exchange: 'NSE', quantity: 150, avg_buy_price: 135.0, buy_date: '2026-02-15', is_paper: false },
                  { id: '2', user_id: 'mock-user-123', ticker: 'TITAN', exchange: 'NSE', quantity: 10, avg_buy_price: 3450.0, buy_date: '2026-03-10', is_paper: false },
                  { id: '3', user_id: 'mock-user-123', ticker: 'TATASTEEL', exchange: 'NSE', quantity: 500, avg_buy_price: 152.0, buy_date: '2026-01-20', is_paper: true }
                ]
                setStorage(table, data)
              }
              return { data, error: null }
            },
            then: (onfulfilled) => {
              let data = getStorage(table)
              if (table === 'holdings' && data.length === 0) {
                data = [
                  { id: '1', user_id: 'mock-user-123', ticker: 'ZOMATO', exchange: 'NSE', quantity: 150, avg_buy_price: 135.0, buy_date: '2026-02-15', is_paper: false },
                  { id: '2', user_id: 'mock-user-123', ticker: 'TITAN', exchange: 'NSE', quantity: 10, avg_buy_price: 3450.0, buy_date: '2026-03-10', is_paper: false },
                  { id: '3', user_id: 'mock-user-123', ticker: 'TATASTEEL', exchange: 'NSE', quantity: 500, avg_buy_price: 152.0, buy_date: '2026-01-20', is_paper: true }
                ]
                setStorage(table, data)
              }
              return Promise.resolve(onfulfilled({ data, error: null }))
            }
          }
        },
        insert: (rows) => {
          return {
            execute: async () => {
              const data = getStorage(table)
              const newRows = (Array.isArray(rows) ? rows : [rows]).map(row => ({
                id: Math.random().toString(36).substr(2, 9),
                created_at: new Date().toISOString(),
                ...row
              }))
              setStorage(table, [...data, ...newRows])
              return { data: newRows, error: null }
            },
            select: () => {
              return {
                single: async () => {
                  const data = getStorage(table)
                  const newRow = {
                    id: Math.random().toString(36).substr(2, 9),
                    created_at: new Date().toISOString(),
                    ...(Array.isArray(rows) ? rows[0] : rows)
                  }
                  setStorage(table, [...data, newRow])
                  return { data: newRow, error: null }
                },
                then: (onfulfilled) => {
                  const data = getStorage(table)
                  const newRow = {
                    id: Math.random().toString(36).substr(2, 9),
                    created_at: new Date().toISOString(),
                    ...(Array.isArray(rows) ? rows[0] : rows)
                  }
                  setStorage(table, [...data, newRow])
                  return Promise.resolve(onfulfilled({ data: newRow, error: null }))
                }
              }
            },
            then: (onfulfilled) => {
              const data = getStorage(table)
              const newRows = (Array.isArray(rows) ? rows : [rows]).map(row => ({
                id: Math.random().toString(36).substr(2, 9),
                created_at: new Date().toISOString(),
                ...row
              }))
              setStorage(table, [...data, ...newRows])
              return Promise.resolve(onfulfilled({ data: newRows, error: null }))
            }
          }
        },
        upsert: (rows) => {
          return {
            select: () => {
              return {
                single: async () => {
                  const data = getStorage(table)
                  const inputRow = Array.isArray(rows) ? rows[0] : rows
                  
                  // Simple check for profiles which use 'id' as key
                  const index = data.findIndex(item => item.id === inputRow.id)
                  let updatedRow = { ...inputRow }
                  
                  if (index !== -1) {
                    data[index] = { ...data[index], ...inputRow }
                    updatedRow = data[index]
                  } else {
                    data.push(updatedRow)
                  }
                  setStorage(table, data)
                  return { data: updatedRow, error: null }
                },
                then: (onfulfilled) => {
                  const data = getStorage(table)
                  const inputRow = Array.isArray(rows) ? rows[0] : rows
                  const index = data.findIndex(item => item.id === inputRow.id)
                  let updatedRow = { ...inputRow }
                  
                  if (index !== -1) {
                    data[index] = { ...data[index], ...inputRow }
                    updatedRow = data[index]
                  } else {
                    data.push(updatedRow)
                  }
                  setStorage(table, data)
                  return Promise.resolve(onfulfilled({ data: updatedRow, error: null }))
                }
              }
            }
          }
        },
        delete: () => {
          return {
            eq: (col, val) => {
              return {
                execute: async () => {
                  let data = getStorage(table)
                  data = data.filter(item => item[col] !== val)
                  setStorage(table, data)
                  return { error: null }
                },
                then: (onfulfilled) => {
                  let data = getStorage(table)
                  data = data.filter(item => item[col] !== val)
                  setStorage(table, data)
                  return Promise.resolve(onfulfilled({ error: null }))
                }
              }
            }
          }
        }
      }
    }
  }
}

export default supabase
export { supabase }
