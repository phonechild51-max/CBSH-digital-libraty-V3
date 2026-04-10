import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isAdminRoute   = createRouteMatcher(['/admin(.*)'])
const isTeacherRoute = createRouteMatcher(['/teacher(.*)'])
const isStudentRoute = createRouteMatcher(['/student(.*)'])
const isPublic       = createRouteMatcher(['/sign-in(.*)','/sign-up(.*)','/unauthorized'])

export default clerkMiddleware((auth, req) => {
  if (isPublic(req)) return NextResponse.next()

  const { userId, sessionClaims } = auth()
  if (!userId) return NextResponse.redirect(new URL('/sign-in', req.url))

  const role = sessionClaims?.publicMetadata?.role as string | undefined
  if (isAdminRoute(req)   && role !== 'admin')   return NextResponse.redirect(new URL('/unauthorized', req.url))
  if (isTeacherRoute(req) && role !== 'teacher') return NextResponse.redirect(new URL('/unauthorized', req.url))
  if (isStudentRoute(req) && role !== 'student') return NextResponse.redirect(new URL('/unauthorized', req.url))

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|webmanifest)).*)']
}
