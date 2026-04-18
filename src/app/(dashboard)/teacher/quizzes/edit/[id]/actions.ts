'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

async function getTeacherDbId(supabase: ReturnType<typeof createServerClient>) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const { data: dbUser, error } = await supabase
    .from('users')
    .select('id, role, status')
    .eq('insforge_uid', userId)
    .single()

  if (error || !dbUser) throw new Error('User not found')
  if (dbUser.role !== 'teacher' && dbUser.role !== 'admin') throw new Error('Forbidden')
  if (dbUser.status !== 'approved') throw new Error('Account not approved')

  return dbUser.id as string
}

const QuizMetaSchema = z.object({
  title: z.string().min(3).max(200),
  subject: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  duration: z.number().int().min(1).max(300),
  passing_marks: z.number().int().min(0),
  total_marks: z.number().int().min(1),
})

export type QuizMetaInput = z.infer<typeof QuizMetaSchema>

export async function updateQuizMeta(quizId: string, input: QuizMetaInput) {
  const supabase = createServerClient()
  const teacherDbId = await getTeacherDbId(supabase)

  const parsed = QuizMetaSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input: ' + JSON.stringify(parsed.error.flatten()))

  if (parsed.data.passing_marks > parsed.data.total_marks) {
    throw new Error('Passing marks cannot exceed total marks')
  }

  const { error } = await supabase
    .from('quizzes')
    .update({
      title: parsed.data.title,
      subject: parsed.data.subject,
      description: parsed.data.description ?? null,
      duration: parsed.data.duration,
      passing_marks: parsed.data.passing_marks,
      total_marks: parsed.data.total_marks,
    })
    .eq('id', quizId)
    .eq('created_by', teacherDbId) // ownership check

  if (error) throw new Error(`Failed to update quiz: ${error.message}`)

  revalidatePath('/teacher/quizzes')
  revalidatePath(`/teacher/quizzes/edit/${quizId}`)
}

const QuestionSchema = z.object({
  id: z.string().optional(), // undefined = new question
  question_text: z.string().min(3),
  option_a: z.string().min(1),
  option_b: z.string().min(1),
  option_c: z.string().min(1),
  option_d: z.string().min(1),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
  marks: z.number().int().min(1).max(100),
  question_order: z.number().int().min(1),
})

export type QuestionInput = z.infer<typeof QuestionSchema>

export async function updateQuizQuestions(quizId: string, questions: QuestionInput[]) {
  const supabase = createServerClient()
  const teacherDbId = await getTeacherDbId(supabase)

  // Verify ownership
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id')
    .eq('id', quizId)
    .eq('created_by', teacherDbId)
    .single()

  if (!quiz) throw new Error('Quiz not found or you do not own it')

  // Validate all questions
  const parsed = questions.map((q, i) => {
    const r = QuestionSchema.safeParse(q)
    if (!r.success) throw new Error(`Question ${i + 1} invalid: ${JSON.stringify(r.error.flatten())}`)
    return r.data
  })

  // Delete old questions, then re-insert (simplest correct approach for small sets)
  const { error: delError } = await supabase
    .from('questions')
    .delete()
    .eq('quiz_id', quizId)

  if (delError) throw new Error(`Failed to reset questions: ${delError.message}`)

  const { error: insertError } = await supabase
    .from('questions')
    .insert(
      parsed.map((q) => ({
        quiz_id: quizId,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        marks: q.marks,
        question_order: q.question_order,
      }))
    )

  if (insertError) throw new Error(`Failed to save questions: ${insertError.message}`)

  revalidatePath('/teacher/quizzes')
  revalidatePath(`/teacher/quizzes/edit/${quizId}`)
}
