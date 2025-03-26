import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyAuth, unauthorized, forbidden, isRole } from '@/app/lib/auth';

interface Params {
  params: Promise<{ id: string }>;
}

// GET - Get details of a specific discount code
export async function GET(
  req: NextRequest,
  { params }: Params
) {
  try {
    // Get the id from params (which is now a Promise in Next.js 15)
    const { id } = await params;

    // Verify authentication (only Organizers can access discount details)
    const { authorized, user, error } = await verifyAuth(req);

    if (!authorized || !user) {
      return unauthorized();
    }

    if (!isRole(user, ['Organizer'])) {
      return forbidden();
    }

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { success: false, message: 'Invalid discount ID' },
        { status: 400 }
      );
    }

    // Find the discount
    const discount = await prisma.discount.findUnique({
      where: { id: parseInt(id) },
    });

    if (!discount) {
      return NextResponse.json(
        { success: false, message: 'Discount not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      discount,
    });
  } catch (error) {
    console.error('Discount fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 