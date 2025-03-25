import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorized } from '@/app/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const { authorized, user, error } = await verifyAuth(req);

    if (!authorized) {
      return unauthorized();
    }

    // Return user data
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