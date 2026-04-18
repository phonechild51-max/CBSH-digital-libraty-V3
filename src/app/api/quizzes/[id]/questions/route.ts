import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: quizId } = await params
  const supabase = createServerClient()

  // Verify caller is an approved student
  const { data: callerUser } = await supabase
    .from('users')
    .select('role, status')
    .eq('insforge_uid', userId)
    .single()

  if (!callerUser || callerUser.role !== 'student' || callerUser.status !== 'approved') {
    return NextResponse.json({ error: 'Forbidden: only approved students can take quizzes' }, { status: 403 })
  }

  // Verify quiz exists and is published
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('status')
    .eq('id', quizId)
    .single()

  if (!quiz || quiz.status !== 'published') {
    return NextResponse.json({ error: 'Quiz unavailable' }, { status: 404 })
  }

  // Fetch questions WITHOUT correct_answer
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, question_text, option_a, option_b, option_c, option_d, marks, question_order')
    .eq('quiz_id', quizId)
    .order('question_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: `DB Error: ${error.message}` }, { status: 500 })
  }

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: 'No questions found for this quiz.' }, { status: 404 })
  }

  return NextResponse.json({ success: true, questions })
}
