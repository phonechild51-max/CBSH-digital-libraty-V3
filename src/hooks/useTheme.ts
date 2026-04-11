'use client'
import { useState, useEffect, useCallback } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  const applyTheme = useCallback((t: 'dark' | 'light') => {
    document.documentElement.classList.add('theme-transitioning')
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem('cbsh-theme', t)
    setTheme(t)
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 300)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('cbsh-theme') as 'dark' | 'light' | null
    if (saved) applyTheme(saved)
  }, [applyTheme])

  const toggle = useCallback(() => applyTheme(theme === 'dark' ? 'light' : 'dark'), [theme, applyTheme])
  return { theme, toggle }
}
