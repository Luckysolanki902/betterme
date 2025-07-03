import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/welcome', '/bug-report', '/api/webhooks(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const { userId } = await auth()
    
    // If user is not authenticated and trying to access a protected route
    if (!userId) {
      // For API routes, return 401 instead of redirecting
      if (req.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      // For regular pages, redirect to welcome page
      const welcomeUrl = new URL('/welcome', req.url)
      return NextResponse.redirect(welcomeUrl)
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}