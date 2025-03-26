import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcrypt';

// Local implementation of verifyCredentials
async function verifyCredentials(email: string, password: string) {
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Verify credentials
    const result = await verifyCredentials(email, password);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 401 }
      );
    }

    // Return user info - client needs to send email/password with each request
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: result.user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 