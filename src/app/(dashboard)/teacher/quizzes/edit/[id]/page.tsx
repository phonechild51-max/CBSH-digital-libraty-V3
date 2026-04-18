'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession, useUser } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'
import { updateQuizMeta, updateQuizQuestions, type QuestionInput } from './actions'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'

interface QuizMeta {
  id: string
  title: string
  subject: string
  description: string | null
  duration: number
  passing_marks: number
  total_marks: number
  status: string
}

interface Question {
  id?: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  marks: number
  question_order: number
}

const SUBJECTS = [
  'Mathematics', 'English', 'Science', 'Yoruba', 'Social Studies',
  'Civic Education', 'Basic Technology', 'Agricultural Science', 'Other',
]

const emptyQuestion = (order: number): Question => ({
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_answer: 'A',
  marks: 1,
  question_order: order,
})

export default function EditQuizPage() {
  const { id: quizId } = useParams() as { id: string }
  const router = useRouter()
  const { session } = useSession()
  const { user } = useUser()

  const [meta, setMeta] = useState<QuizMeta | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'meta' | 'questions'>('meta')

  const tokenRef = useRef<string | null>(null)
  const sbRef = useRef<ReturnType<typeof createClient> | null>(null)

  const getClient = useCallback(async () => {
    if (!session) return null
    const token = await session.getToken({ template: 'supabase' })
    if (!token) return null
    if (token !== tokenRef.current || !sbRef.current) {
      tokenRef.current = token
      sbRef.current = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      )
    }
    return sbRef.current
  }, [session])

  useEffect(() => {
    const load = async () => {
      if (!session || !user) return
      const sb = await getClient()
      if (!sb) return

      const { data: userRaw } = await sb.from('users').select('id').eq('insforge_uid', user.id).single()
      if (!userRaw) { setLoading(false); return }
      const userData = userRaw as { id: string }

      // Sequential queries to avoid TS generics issues with mixed .single() in Promise.all
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const quizRes = await (sb as any).from('quizzes')
        .select('id, title, subject, description, duration, passing_marks, total_marks, status')
        .eq('id', quizId)
        .eq('created_by', userData.id)
        .maybeSingle()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const questionsRes = await (sb as any).from('questions')
        .select('id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, question_order')
        .eq('quiz_id', quizId)
        .order('question_order', { ascending: true })

      if (quizRes.data) setMeta(quizRes.data as unknown as QuizMeta)
      if (questionsRes.data) setQuestions(questionsRes.data as unknown as Question[])
      setLoading(false)
    }
    load()
  }, [session, user, quizId, getClient])

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const handleSaveMeta = async () => {
    if (!meta) return
    setSaving(true)
    try {
      await updateQuizMeta(quizId, {
        title: meta.title,
        subject: meta.subject,
        description: meta.description ?? undefined,
        duration: meta.duration,
        passing_marks: meta.passing_marks,
        total_marks: meta.total_marks,
      })
      showToast('success', 'Quiz details saved.')
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveQuestions = async () => {
    setSaving(true)
    try {
      const payload: QuestionInput[] = questions.map((q, i) => ({
        ...q,
        question_order: i + 1,
      }))
      await updateQuizQuestions(quizId, payload)
      showToast('success', 'Questions saved.')
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const addQuestion = () =>
    setQuestions(prev => [...prev, emptyQuestion(prev.length + 1)])

  const removeQuestion = (idx: number) =>
    setQuestions(prev => prev.filter((_, i) => i !== idx))

  const updateQuestion = (idx: number, patch: Partial<Question>) =>
    setQuestions(prev => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)))

  const inputStyle = {
    backgroundColor: 'var(--color-bg-input)',
    border: '1px solid var(--color-border-input)',
    color: 'var(--color-text-primary)',
    borderRadius: '0.75rem',
    padding: '0.625rem 0.875rem',
    fontSize: '0.875rem',
    width: '100%',
    outline: 'none',
  } as React.CSSProperties

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 animate-spin"
          style={{ borderColor: 'var(--color-accent-amber)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!meta) {
    return (
      <div className="text-center py-20">
        <AlertTriangle size={48} className="mx-auto mb-4" style={{ color: 'var(--color-danger)' }} />
        <p style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-display)' }}>
          Quiz not found or you do not have permission to edit it.
        </p>
        <Link href="/teacher/quizzes" className="mt-4 inline-block px-5 py-2 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: 'var(--color-accent-amber)', color: '#000' }}>
          Back to Quizzes
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-4xl">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-[200] flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all"
          style={{
            backgroundColor: toast.type === 'success' ? 'var(--color-success-subtle)' : 'var(--color-danger-subtle)',
            color: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
            border: `1px solid ${toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`,
          }}
        >
          {toast.type === 'success'
            ? <CheckCircle2 size={16} />
            : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/teacher/quizzes"
          className="p-2 rounded-lg hover:bg-[var(--color-bg-card)] transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-heading)' }}>
            Edit Quiz
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {meta.title} · <span className="capitalize">{meta.status}</span>
          </p>
        </div>
        {meta.status === 'published' && (
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: 'var(--color-warning-subtle)', color: 'var(--color-warning)', border: '1px solid var(--color-warning)' }}>
            <AlertTriangle size={13} />
            Published — edits are live
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)' }}>
        {(['meta', 'questions'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: activeTab === tab ? 'var(--color-accent-amber)' : 'transparent',
              color: activeTab === tab ? '#000' : 'var(--color-text-secondary)',
            }}>
            {tab === 'meta' ? 'Quiz Details' : `Questions (${questions.length})`}
          </button>
        ))}
      </div>

      {/* ── Meta Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'meta' && (
        <div className="rounded-xl p-6 space-y-5" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)' }}>
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Title</label>
            <input value={meta.title} onChange={e => setMeta(p => p ? { ...p, title: e.target.value } : p)}
              style={inputStyle} placeholder="Quiz title" />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Subject</label>
            <select value={meta.subject} onChange={e => setMeta(p => p ? { ...p, subject: e.target.value } : p)}
              style={inputStyle}>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Description (optional)</label>
            <textarea value={meta.description ?? ''} onChange={e => setMeta(p => p ? { ...p, description: e.target.value } : p)}
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Brief description..." />
          </div>

          {/* Duration / Marks row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Duration (mins)', field: 'duration' as const, min: 1, max: 300 },
              { label: 'Total Marks', field: 'total_marks' as const, min: 1, max: 1000 },
              { label: 'Passing Marks', field: 'passing_marks' as const, min: 0, max: 1000 },
            ].map(({ label, field, min, max }) => (
              <div key={field}>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>{label}</label>
                <input type="number" min={min} max={max} value={meta[field]}
                  onChange={e => setMeta(p => p ? { ...p, [field]: parseInt(e.target.value) || 0 } : p)}
                  style={inputStyle} />
              </div>
            ))}
          </div>

          <button onClick={handleSaveMeta} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-accent-amber)', color: '#000' }}>
            <Save size={16} />
            {saving ? 'Saving…' : 'Save Details'}
          </button>
        </div>
      )}

      {/* ── Questions Tab ─────────────────────────────────────────────── */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={idx} className="rounded-xl p-5 space-y-3"
              style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)' }}>
              {/* Q header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'var(--color-accent-amber-subtle)', color: 'var(--color-accent-amber)' }}>
                  Q{idx + 1}
                </span>
                <button onClick={() => removeQuestion(idx)}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-danger-subtle)] transition-colors"
                  style={{ color: 'var(--color-danger)' }}>
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Question text */}
              <textarea value={q.question_text} onChange={e => updateQuestion(idx, { question_text: e.target.value })}
                placeholder="Question text…" style={{ ...inputStyle, minHeight: '64px', resize: 'vertical' }} />

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(['A', 'B', 'C', 'D'] as const).map(key => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        backgroundColor: q.correct_answer === key ? 'var(--color-success)' : 'var(--color-bg-input)',
                        color: q.correct_answer === key ? '#fff' : 'var(--color-text-secondary)',
                      }}>
                      {key}
                    </span>
                    <input value={q[`option_${key.toLowerCase()}` as keyof Question] as string}
                      onChange={e => updateQuestion(idx, { [`option_${key.toLowerCase()}`]: e.target.value })}
                      placeholder={`Option ${key}`} style={{ ...inputStyle, flex: 1 }} />
                  </div>
                ))}
              </div>

              {/* Correct answer + marks */}
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Correct Answer</label>
                  <select value={q.correct_answer}
                    onChange={e => updateQuestion(idx, { correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                    style={{ ...inputStyle, width: 'auto' }}>
                    {['A', 'B', 'C', 'D'].map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Marks</label>
                  <input type="number" min={1} max={100} value={q.marks}
                    onChange={e => updateQuestion(idx, { marks: parseInt(e.target.value) || 1 })}
                    style={{ ...inputStyle, width: '80px' }} />
                </div>
              </div>
            </div>
          ))}

          {/* Add question */}
          <button onClick={addQuestion}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all border-2 border-dashed hover:scale-[1.005]"
            style={{ borderColor: 'var(--color-border-card)', color: 'var(--color-text-muted)' }}>
            <Plus size={16} />
            Add Question
          </button>

          {/* Save questions */}
          <div className="pt-2">
            <button onClick={handleSaveQuestions} disabled={saving || questions.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-accent-amber)', color: '#000' }}>
              <Save size={16} />
              {saving ? 'Saving…' : `Save ${questions.length} Question${questions.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
