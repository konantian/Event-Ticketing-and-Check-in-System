import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorized } from '@/app/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { authorized, user, error } = await verifyAuth(req);

    if (!authorized) {
      return unauthorized();
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 