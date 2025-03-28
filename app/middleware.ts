import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, getTokenFromHeader } from './lib/jwt';

export function middleware(request: NextRequest) {
  const protectedPaths = [
    '/api/events/create',
    '/api/tickets',
    '/api/user/profile',
    '/api/discounts',
    '/api/checkin',
  ];

  // Check if the current path requires authentication
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');
  const token = getTokenFromHeader(authHeader || '');

  if (!token) {
    return new NextResponse(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const payload = verifyToken(token);
  if (!payload) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid or expired token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Add user information to the request headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
} 