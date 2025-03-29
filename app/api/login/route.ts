import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcrypt';
import { signToken } from '@/app/lib/jwt';

function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function verifyCredentials(email: string, password: string) {
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
      id: user.id.toString(),
      email: user.email,
      role: user.role,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    email = sanitizeEmail(email);

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    const result = await verifyCredentials(email, password);

    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role
    });

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: result.user,
      token: token
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 