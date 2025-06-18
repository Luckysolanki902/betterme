import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/welcome', 
  '/bug-report', 
  '/api/webhooks/clerk(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // Allow static files and Next.js internals
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Try to get auth info with await
  try {
    const authResult = await auth();
    const { userId } = authResult;
    
    if (userId && pathname === '/welcome') {
      console.log('Authenticated user on welcome page, redirecting to dashboard');
      return NextResponse.redirect(new URL('/', req.url));
    }

    // If route is public, allow access
    if (isPublicRoute(req)) {
      return NextResponse.next();
    }

    // For API routes, return 401 if not authenticated
    if (pathname.startsWith('/api/') && !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For page routes, redirect to welcome page if not authenticated
    if (!userId && (pathname !== '/welcome' || pathname!== '/bug-report')) {
      console.log('Unauthenticated user trying to access protected route, redirecting to welcome');
      return NextResponse.redirect(new URL('/welcome', req.url));
    }

    return NextResponse.next();  } catch (error) {
    console.error('Auth error in middleware:', error);
    // If there's an auth error and it's not a public route, redirect to welcome
    if (!isPublicRoute(req)) {
      return NextResponse.redirect(new URL('/welcome', req.url));
    }
    return NextResponse.next();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
