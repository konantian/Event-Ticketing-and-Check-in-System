import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/app/lib/prisma';
import { signToken } from '@/app/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, role = 'Attendee' } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
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