import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

const GradeSchema = z.object({
  answers: z.record(z.string(), z.enum(['A', 'B', 'C', 'D'])),
  time_taken: z.number().int().min(0).max(86400),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = GradeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { answers, time_taken } = parsed.data
  const { id: quizId } = await params
  const supabase = createServerClient()

  // Verify user is an approved student
  const { data: user } = await supabase
    .from('users')
    .select('id, status, role')
    .eq('insforge_uid', userId)
    .single()

  if (!user || user.status !== 'approved' || user.role !== 'student') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Verify quiz exists and is published
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single()

  if (!quiz || quiz.status !== 'published') {
    return NextResponse.json({ error: 'Quiz unavailable' }, { status: 404 })
  }

  // Check if already attempted
  const { count } = await supabase
    .from('quiz_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('quiz_id', quizId)
    .eq('student_id', user.id)

  if ((count ?? 0) >= 1) {
    return NextResponse.json({ error: 'Already attempted' }, { status: 409 })
  }

  // Fetch questions with correct answers (server-side only)
  const { data: questions } = await supabase
    .from('questions')
    .select('id, correct_answer, marks')
    .eq('quiz_id', quizId)

  if (!questions?.length) {
    return NextResponse.json({ error: 'No questions found' }, { status: 404 })
  }

  // Calculate score
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)
  const score = questions.reduce(
    (sum, q) => (answers[q.id] === q.correct_answer ? sum + q.marks : sum),
    0
  )
  const percentage =
    totalMarks > 0 ? Math.round((score / totalMarks) * 10000) / 100 : 0
  const status = score >= quiz.passing_marks ? 'pass' : 'fail'
  const correctAnswersJson = Object.fromEntries(
    questions.map((q) => [q.id, q.correct_answer])
  )

  // Insert attempt
  const { data: attempt } = await supabase
    .from('quiz_attempts')
    .insert({
      quiz_id: quizId,
      student_id: user.id,
      score,
      total_marks: totalMarks,
      percentage,
      status,
      time_taken,
      answers_json: answers,
      correct_answers_json: correctAnswersJson,
    })
    .select('id')
    .single()

  // Create notification for the student
  await supabase.from('notifications').insert({
    user_id: user.id,
    message: `Quiz result: ${score}/${totalMarks} (${percentage}%) — ${status === 'pass' ? 'Passed!' : 'Failed'}`,
    type: status === 'pass' ? 'success' : 'warning',
  })

  // Return WITHOUT correct answers — never expose to client
  return NextResponse.json({
    success: true,
    attempt_id: attempt?.id,
    score,
    total_marks: totalMarks,
    percentage,
    status,
  })
}
