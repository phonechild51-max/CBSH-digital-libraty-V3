export const SUBJECTS = [
  'Mathematics','Physics','Chemistry','Biology','Computer Science',
  'English','Hindi','Economics','Political Science','History',
  'Geography','Physical Education'
] as const

export type Subject    = typeof SUBJECTS[number]
export type UserRole   = 'admin' | 'teacher' | 'student'
export type UserStatus = 'pending' | 'email_verified' | 'approved' | 'denied'
export type QuizStatus = 'draft' | 'published' | 'archived'
export type NotifType  = 'info' | 'success' | 'warning' | 'error'
export type Priority   = 'normal' | 'important' | 'urgent'
export type TargetRole = 'all' | 'students' | 'teachers' | 'admins'

export const MAX_SEMESTERS    = 8
export const MAX_UPLOAD_MB    = 25
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024
