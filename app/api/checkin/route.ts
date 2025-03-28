import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyAuth, unauthorized, forbidden, isRole } from '@/app/lib/auth';

// POST - Check in a user using a QR code
export async function POST(req: NextRequest) {
  try {
    // Verify authentication (only Staff and Organizers can check in users)
    const { authorized, user, error } = await verifyAuth(req);

    if (!authorized) {
      return unauthorized();
    }

    if (!isRole(user, ['Organizer', 'Staff'])) {
      return forbidden();
    }

    const body = await req.json();
    const { qrCodeData } = body;

    if (!qrCodeData) {
      return NextResponse.json(
        { success: false, message: 'QR code data is required' },
        { status: 400 }
      );
    }

    // Find ticket with the QR code
    const ticket = await prisma.ticket.findFirst({
      where: { qrCodeData },
      include: {
        event: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        checkIn: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Invalid QR code' },
        { status: 404 }
      );
    }

    if (ticket.checkIn) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Ticket already checked in',
          checkIn: ticket.checkIn
        },
        { status: 400 }
      );
    }

    const checkIn = await prisma.checkIn.create({
      data: {
        ticketId: ticket.id,
        status: 'Checked In',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Check-in successful',
      checkIn,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 