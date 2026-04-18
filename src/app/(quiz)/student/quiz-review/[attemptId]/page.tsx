'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { CheckCircle2, XCircle, ArrowLeft, Minus } from 'lucide-react'
import Link from 'next/link'

interface Question {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  marks: number
  question_order: number
}

interface ReviewData {
  questions: Question[]
  answers: Record<string, string>
}

function QuizReviewContent() {
  const params = useParams()
  const attemptId = params.attemptId as string
  const searchParams = useSearchParams()
  const quizId = searchParams.get('quiz_id') ?? ''

  const [data, setData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!quizId || !attemptId) {
      setError('Invalid review link.')
      setLoading(false)
      return
    }
    fetch(`/api/quizzes/${quizId}/review?attempt_id=${attemptId}`)
      .then(r => r.json())
      .then(json => {
        if (json.questions) setData(json)
        else setError(json.error || 'Failed to load review.')
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false))
  }, [quizId, attemptId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="w-12 h-12 rounded-full border-4 animate-spin"
          style={{ borderColor: 'var(--color-accent-amber)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <XCircle size={48} className="mx-auto mb-4" style={{ color: 'var(--color-danger)' }} />
        <p className="mb-4" style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-display)' }}>
          {error || 'Review unavailable.'}
        </p>
        <Link
          href="/student/quizzes"
          className="px-6 py-2 rounded-lg text-sm font-semibold inline-block"
          style={{ backgroundColor: 'var(--color-accent-amber)', color: '#000' }}
        >
          Back to Quizzes
        </Link>
      </div>
    )
  }

  const { questions, answers } = data

  const optionLabels: Record<string, string> = { A: 'option_a', B: 'option_b', C: 'option_c', D: 'option_d' }

  const getOptionText = (q: Question, key: string) =>
    q[optionLabels[key] as keyof Question] as string

  const correctCount = questions.filter(q => answers[q.id] === q.correct_answer).length
  const totalQ = questions.length

  return (
    <div className="space-y-6 animate-fade-in-up max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/student/quizzes?tab=history"
        className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <ArrowLeft size={16} />
        Back to Quiz History
      </Link>

      {/* Header */}
      <div>
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-heading)' }}
        >
          Answer Review
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          {correctCount} of {totalQ} questions correct
        </p>
      </div>

      {/* Summary bar */}
      <div
        className="rounded-xl p-4 flex items-center gap-6"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)' }}
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
            {correctCount} Correct
          </span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle size={18} style={{ color: 'var(--color-danger)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--color-danger)' }}>
            {totalQ - correctCount} Wrong / Skipped
          </span>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const studentAnswer = answers[q.id]
          const isCorrect = studentAnswer === q.correct_answer
          const isSkipped = !studentAnswer

          const borderColor = isSkipped
            ? 'var(--color-border-card)'
            : isCorrect
            ? 'var(--color-success)'
            : 'var(--color-danger)'

          return (
            <div
              key={q.id}
              className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${borderColor}`, backgroundColor: 'var(--color-bg-card)' }}
            >
              {/* Question header */}
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{
                  backgroundColor: isSkipped
                    ? 'var(--color-bg-app)'
                    : isCorrect
                    ? 'var(--color-success-subtle)'
                    : 'var(--color-danger-subtle)',
                }}
              >
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                  Q{idx + 1} · {q.marks} mark{q.marks > 1 ? 's' : ''}
                </span>
                {isSkipped ? (
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <Minus size={13} /> Skipped
                  </span>
                ) : isCorrect ? (
                  <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--color-success)' }}>
                    <CheckCircle2 size={13} /> Correct
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--color-danger)' }}>
                    <XCircle size={13} /> Incorrect
                  </span>
                )}
              </div>

              {/* Question text */}
              <div className="px-5 pt-4 pb-2">
                <p
                  className="text-sm font-medium mb-4 leading-relaxed"
                  style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
                >
                  {q.question_text}
                </p>

                {/* Options */}
                <div className="space-y-2.5 pb-4">
                  {(['A', 'B', 'C', 'D'] as const).map(key => {
                    const isSelected = studentAnswer === key
                    const isRight = q.correct_answer === key
                    const text = getOptionText(q, key)

                    let bg = 'var(--color-bg-app)'
                    let border = 'var(--color-border-divider)'
                    let textColor = 'var(--color-text-primary)'

                    if (isRight) {
                      bg = 'var(--color-success-subtle)'
                      border = 'var(--color-success)'
                      textColor = 'var(--color-success)'
                    } else if (isSelected && !isRight) {
                      bg = 'var(--color-danger-subtle)'
                      border = 'var(--color-danger)'
                      textColor = 'var(--color-danger)'
                    }

                    return (
                      <div
                        key={key}
                        className="flex items-start gap-3 p-3 rounded-lg"
                        style={{ backgroundColor: bg, border: `1px solid ${border}` }}
                      >
                        <span
                          className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold"
                          style={{
                            backgroundColor: isRight
                              ? 'var(--color-success)'
                              : isSelected
                              ? 'var(--color-danger)'
                              : 'var(--color-bg-input)',
                            color: (isRight || isSelected) ? '#fff' : 'var(--color-text-secondary)',
                          }}
                        >
                          {key}
                        </span>
                        <span className="text-sm pt-0.5" style={{ color: textColor }}>
                          {text}
                        </span>
                        {isRight && (
                          <CheckCircle2 size={15} className="ml-auto flex-shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
                        )}
                        {isSelected && !isRight && (
                          <XCircle size={15} className="ml-auto flex-shrink-0 mt-0.5" style={{ color: 'var(--color-danger)' }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom nav */}
      <div className="pt-4">
        <Link
          href="/student/quizzes"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: 'var(--color-accent-amber)', color: '#000' }}
        >
          <ArrowLeft size={16} />
          Back to Quizzes
        </Link>
      </div>
    </div>
  )
}

export default function QuizReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div
            className="w-12 h-12 rounded-full border-4 animate-spin"
            style={{ borderColor: 'var(--color-accent-amber)', borderTopColor: 'transparent' }}
          />
        </div>
      }
    >
      <QuizReviewContent />
    </Suspense>
  )
}
