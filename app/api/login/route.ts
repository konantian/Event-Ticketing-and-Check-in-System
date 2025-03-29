import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials } from '@/app/lib/auth';
import { signToken } from '@/app/lib/jwt';
import { sanitizeEmail, isValidEmail } from '@/app/lib/validation';

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