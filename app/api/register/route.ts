import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/app/lib/prisma';
import { signToken } from '@/app/lib/jwt';

const VALID_ROLES = ['Attendee', 'Organizer', 'Admin'] as const;
type UserRole = typeof VALID_ROLES[number];

function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

function isValidRole(role: string): role is UserRole {
  return VALID_ROLES.includes(role as UserRole);
}

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

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });

    const token = signToken({
      userId: user.id.toString(),
      email: user.email,
      role: user.role
    });

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token: token
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 