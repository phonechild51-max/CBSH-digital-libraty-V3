import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const serviceClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: quizId } = await params
  const attemptId = req.nextUrl.searchParams.get('attempt_id')

  if (!attemptId) {
    return NextResponse.json({ error: 'attempt_id is required' }, { status: 400 })
  }

  const sb = serviceClient()

  // 1. Look up the student's DB id
  const { data: dbUser } = await sb
    .from('users')
    .select('id, role, status')
    .eq('insforge_uid', userId)
    .single()

  if (!dbUser || dbUser.status !== 'approved') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Verify the attempt belongs to this student (admins can also review)
  const { data: attempt } = await sb
    .from('quiz_attempts')
    .select('id, answers_json, student_id')
    .eq('id', attemptId)
    .eq('quiz_id', quizId)
    .single()

  if (!attempt) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
  }

  if (dbUser.role === 'student' && attempt.student_id !== dbUser.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 3. Fetch questions WITH correct_answer (service role bypasses RLS)
  const { data: questions, error: qErr } = await sb
    .from('questions')
    .select('id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, question_order')
    .eq('quiz_id', quizId)
    .order('question_order', { ascending: true })

  if (qErr || !questions) {
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 })
  }

  return NextResponse.json({
    questions,
    answers: attempt.answers_json ?? {},
  })
}
