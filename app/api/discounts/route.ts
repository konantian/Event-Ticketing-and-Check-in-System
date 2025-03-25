import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyAuth, unauthorized, forbidden, isRole } from '@/app/lib/auth';

// GET - List all discount codes
export async function GET(req: NextRequest) {
  try {
    // Verify authentication (only Organizers can list all discount codes)
    const { authorized, user, error } = await verifyAuth(req);

    if (!authorized) {
      return unauthorized();
    }

    if (!isRole(user, ['Organizer'])) {
      return forbidden();
    }

    // Get all discount codes
    const discounts = await prisma.discount.findMany();

    return NextResponse.json({
      success: true,
      discounts,
    });
  } catch (error) {
    console.error('Discounts fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new discount code (Organizer only)
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const { authorized, user, error } = await verifyAuth(req);

    if (!authorized) {
      return unauthorized();
    }

    if (!isRole(user, ['Organizer'])) {
      return forbidden();
    }

    const body = await req.json();
    const { code, type, value } = body;

    // Validate input
    if (!code || !type || value === undefined) {
      return NextResponse.json(
        { success: false, message: 'Code, type, and value are required' },
        { status: 400 }
      );
    }

    if (!['Percentage', 'Fixed Amount'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Type must be either "Percentage" or "Fixed Amount"' },
        { status: 400 }
      );
    }

    if (type === 'Percentage' && (value < 0 || value > 100)) {
      return NextResponse.json(
        { success: false, message: 'Percentage value must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (value < 0) {
      return NextResponse.json(
        { success: false, message: 'Value cannot be negative' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingDiscount = await prisma.discount.findFirst({
      where: { code },
    });

    if (existingDiscount) {
      return NextResponse.json(
        { success: false, message: 'Discount code already exists' },
        { status: 409 }
      );
    }

    // Create discount code
    const discount = await prisma.discount.create({
      data: {
        code,
        type,
        value: Number(value),
        timesUsed: 0,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Discount code created successfully',
        discount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Discount creation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 