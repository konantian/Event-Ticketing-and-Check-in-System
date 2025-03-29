import { NextRequest, NextResponse } from 'next/server';
import { createUser, checkUserExists } from '@/app/lib/auth';
import { signToken } from '@/app/lib/jwt';
import { 
  sanitizeEmail, 
  isValidEmail, 
  isValidPassword, 
  isValidRole,
  VALID_ROLES 
} from '@/app/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { email, password, role = 'Attendee' } = body;

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

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (!isValidRole(role)) {
      return NextResponse.json(
        { success: false, message: `Invalid role. Role must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    const userExists = await checkUserExists(email);
    if (userExists) {
      return NextResponse.json(
        { success: false, message: 'User already exists' },
        { status: 409 }
      );
    }

    const user = await createUser(email, password, role);
    
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user,
      token
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 