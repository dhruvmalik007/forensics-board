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
    pathname.startsWith('/login') ||
    pathname.startsWith('/callback') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/chat') || // Allow chat routes without authentication
    pathname.startsWith('/dashboard'); // Allow dashboard without authentication
    
  // Respond to CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleCORS(request);
  }
  
  // Check for authentication token (could be Privy or NextAuth)
  // For Privy, we'll check for a specific cookie
  const hasPrivyToken = request.cookies.has('privy-token');
  const hasNextAuthToken = request.cookies.has('next-auth.session-token') || request.cookies.has('__Secure-next-auth.session-token');
  
  // If it's a public route, allow access
  if (isPublicRoute) {
    return addSecurityHeaders(NextResponse.next());
  }
  
  // If it's a protected route and user has a Privy token or NextAuth token, allow access
  if (hasPrivyToken || hasNextAuthToken) {
    return addSecurityHeaders(NextResponse.next());
  }
  
  // Otherwise, redirect to the login page
  const url = new URL('/login', request.url);
  url.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(url);
}

// Add security headers including COOP
function addSecurityHeaders(response: NextResponse) {
  // Add Cross-Origin-Opener-Policy header
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  
  // Add other security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

// Handle CORS preflight requests
function handleCORS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}

// Configure routes that will trigger the middleware
export const config = {
  matcher: [
    // Auth routes
    '/',
    '/login',
    '/register',
    '/callback',
    // Chat routes
    '/chat',
    '/chat/:path*',
    // API routes
    '/api/:path*'
  ]
};
