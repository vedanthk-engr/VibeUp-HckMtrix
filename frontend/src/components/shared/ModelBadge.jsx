import React from 'react'

const ModelBadge = ({ model }) => {
  if (model === "gemma") return (
    <span style={{
      fontSize: '10px',
      padding: '2px 8px',
      borderRadius: '99px',
      background: '#EFF6FF',
      color: '#1D4ED8',
      border: '1px solid #BFDBFE',
      fontFamily: 'var(--font-mono, monospace)',
      fontWeight: 500
    }}>
      Gemma ⚡
    </span>
  )
  return (
    <span style={{
      fontSize: '10px',
      padding: '2px 8px', 
      borderRadius: '99px',
      background: '#F5F3FF',
      color: '#6D28D9',
      border: '1px solid #DDD6FE',
      fontFamily: 'var(--font-mono, monospace)',
      fontWeight: 500
    }}>
      Claude 🧠
    </span>
  )
}

export default ModelBadge
