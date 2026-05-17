'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'default' | 'dark'>('default')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const storedTheme = localStorage.getItem('umkm-theme') as 'default' | 'dark' | null
    if (storedTheme === 'dark') {
      setTheme('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'default' ? 'dark' : 'default'
    setTheme(newTheme)
    localStorage.setItem('umkm-theme', newTheme)
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div style={{ padding: '10px 12px', height: '44px' }} />
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="btn btn-ghost"
      style={{
        width: '100%', 
        justifyContent: 'space-between',
        padding: '10px 12px', 
        fontSize: '0.9rem', 
        borderRadius: '10px', 
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {theme === 'default' ? <Moon size={18} /> : <Sun size={18} />}
        <span>Tema Gelap</span>
      </div>
      
      {/* Switch UI */}
      <div
        style={{
          width: '36px',
          height: '20px',
          background: theme === 'dark' ? 'var(--primary)' : 'var(--border)',
          borderRadius: '20px',
          position: 'relative',
          transition: 'background 0.2s ease',
        }}
      >
        <div
          style={{
            width: '16px',
            height: '16px',
            background: 'white',
            borderRadius: '50%',
            position: 'absolute',
            top: '2px',
            left: theme === 'dark' ? '18px' : '2px',
            transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        />
      </div>
    </button>
  )
}
