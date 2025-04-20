import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyAuth, unauthorized } from '@/app/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Discount code is required' },
        { status: 400 }
      );
    }

    const { authorized, user } = await verifyAuth(req);

    if (!authorized || !user) {
      return unauthorized();
    }

    const discount = await prisma.discount.findFirst({
      where: { code },
    });

    if (!discount) {
      return NextResponse.json(
        { success: false, message: 'Invalid discount code' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      discount,
    });
  } catch (error) {
    console.error('Discount validate error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
