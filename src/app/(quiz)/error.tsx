'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function QuizError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Quiz Error]', error)
  }, [error])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{
        backgroundColor: 'var(--color-bg-app)',
        color: 'var(--color-text-primary)',
      }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{
          backgroundColor: 'var(--color-danger-subtle)',
          border: '1px solid var(--color-danger)',
        }}
      >
        <AlertTriangle className="w-8 h-8" style={{ color: 'var(--color-danger)' }} />
      </div>

      <h1
        className="text-2xl font-bold mb-2"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-heading)' }}
      >
        Quiz Error
      </h1>
      <p className="text-sm mb-8 max-w-md" style={{ color: 'var(--color-text-secondary)' }}>
        Something went wrong while loading the quiz. Your progress may not have been saved. Please try again.
      </p>

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--color-accent-amber)', color: '#000' }}
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
        <Link
          href="/student/quizzes"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-card)',
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quizzes
        </Link>
      </div>
    </div>
  )
}
