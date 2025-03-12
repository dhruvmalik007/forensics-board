import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authConfig } from '@/app/(auth)/auth.config';

// This function handles authentication checks using both NextAuth and Privy
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const isPublicRoute = 
    pathname === '/' || 
    pathname.startsWith('/register') || 
    pathname.startsWith('/callback');
    
  // Check for authentication token (could be Privy or NextAuth)
  // For Privy, we'll check for a specific cookie
  const hasPrivyToken = request.cookies.has('privy-token');
  
  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // If it's a protected route and user has a Privy token, allow access
  if (hasPrivyToken) {
    return NextResponse.next();
  }
  
  // Otherwise, redirect to the root page which has the login
  const url = new URL('/', request.url);
  return NextResponse.redirect(url);
}

// Configure routes that will trigger the middleware
export const config = {
  matcher: [
    // Auth routes
    '/',
    '/register',
    '/callback',
    // Chat routes
    '/chat',
    '/chat/:path*',
    // API routes
    '/api/:path*'
  ]
};
