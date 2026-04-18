import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isAdminRoute   = createRouteMatcher(['/admin(.*)'])
const isTeacherRoute = createRouteMatcher(['/teacher(.*)'])
const isStudentRoute = createRouteMatcher(['/student(.*)'])
const isPublic       = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/unauthorized', '/api/webhooks(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isPublic(req)) return NextResponse.next()

  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.redirect(new URL('/sign-in', req.url))

  const role = (sessionClaims?.publicMetadata as { role?: string })?.role
  const status = (sessionClaims?.publicMetadata as { status?: string })?.status

  // Denied users should never access the app regardless of role state
  if (status === 'denied') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  const isOnboarding = req.nextUrl.pathname === '/onboarding';

  if (!role) {
    if (!isOnboarding) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }
    // If they have no role and are on onboarding, let them proceed
    return NextResponse.next();
  }

  // If they have a role, don't let them stay on onboarding page
  if (isOnboarding && role) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (isAdminRoute(req)   && role !== 'admin')   return NextResponse.redirect(new URL('/unauthorized', req.url))
  if (isTeacherRoute(req) && role !== 'teacher') return NextResponse.redirect(new URL('/unauthorized', req.url))
  if (isStudentRoute(req) && role !== 'student') return NextResponse.redirect(new URL('/unauthorized', req.url))

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|webmanifest)).*)']
}
