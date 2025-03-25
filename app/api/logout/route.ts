import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Client should simply discard the auth key
  return NextResponse.json({
    success: true,
    message: 'Logout successful',
  });
} 