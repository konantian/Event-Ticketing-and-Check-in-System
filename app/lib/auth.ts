import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';
import bcrypt from 'bcrypt';

// Verify user credentials
export async function verifyCredentials(email: string, password: string) {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { success: false, message: 'Invalid credentials' };
  }

  // Verify password
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
    // Continue with normal authentication
    let email: string | null = null;
    let password: string | null = null;
    let body: Record<string, any> = {};
    
    // For DELETE requests, get credentials from URL parameters
    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      email = url.searchParams.get('email');
      password = url.searchParams.get('password');
    } else {
      // Get credentials from request body for other methods
      body = await req.json();
      email = body.email;
      password = body.password;
    }
    
    if (!email || !password) {
      return { authorized: false, error: 'Credentials required' };
    }
    
    // Verify the credentials
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return { authorized: false, error: 'User not found' };
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return { authorized: false, error: 'Invalid password' };
    }
    
    return { 
      authorized: true, 
      user: { id: user.id, email: user.email, role: user.role },
      // Return the original request body without the credentials
      body: Object.fromEntries(
        Object.entries(body).filter(([key]) => !['email', 'password'].includes(key))
      )
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