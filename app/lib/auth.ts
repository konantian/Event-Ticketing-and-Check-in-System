import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeader } from './jwt';
import { prisma } from './prisma';
import bcrypt from 'bcrypt';

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { success: false, message: 'Invalid credentials' };
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return { success: false, message: 'Invalid credentials' };
  }

  return {
    success: true,
    message: 'Authentication successful',
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

export async function verifyAuth(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');

    if (!token) {
      return { authorized: false, error: 'Authentication required' };
    }

    const payload = verifyToken(token);
    if (!payload) {
      return { authorized: false, error: 'Invalid or expired token' };
    }

    // Check if user still exists in database
    const dbUser = await prisma.user.findUnique({
      where: { id: parseInt(payload.userId) },
      select: { id: true, email: true, role: true }
    });

    if (!dbUser) {
      return { authorized: false, error: 'User not found' };
    }

    // Get request body if available
    let body = {};
    try {
      if (req.method !== 'GET' && req.method !== 'DELETE') {
        const clonedReq = req.clone();
        body = await clonedReq.json();
      }
    } catch (e) {
      console.warn('Could not parse request body');
    }

    return { 
      authorized: true, 
      user: dbUser,
      body
    };
  } catch (error) {
    return { authorized: false, error: 'Authentication error' };
  }
}

export function isRole(user: any, roles: string[]) {
  return user && roles.includes(user.role);
}

export function unauthorized() {
  return NextResponse.json(
    { success: false, message: 'Unauthorized' },
    { status: 401 }
  );
}

export function forbidden() {
  return NextResponse.json(
    { success: false, message: 'Forbidden' },
    { status: 403 }
  );
} 