'use client'
import { useState, useCallback, useEffect } from 'react'

// Derive the initial theme synchronously from document to avoid FOUC.
// The blocking inline script in layout handles the first paint; this just
// reads the already-applied value so React state matches immediately.
function getInitialTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark'
  return (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark'
}

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme)

  const applyTheme = useCallback((t: 'dark' | 'light') => {
    document.documentElement.classList.add('theme-transitioning')
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem('cbsh-theme', t)
    setTheme(t)
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 300)
  }, [])

  // Sync React state if the document was already patched by the blocking script
  useEffect(() => {
    const saved = localStorage.getItem('cbsh-theme') as 'dark' | 'light' | null
    if (saved && saved !== theme) applyTheme(saved)
    // We intentionally only run this once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggle = useCallback(() => applyTheme(theme === 'dark' ? 'light' : 'dark'), [theme, applyTheme])
  return { theme, toggle }
}
