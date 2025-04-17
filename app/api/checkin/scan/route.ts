import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyAuth, isRole, unauthorized, forbidden } from '@/app/lib/auth';

// POST - Check in by scanning a QR code - requires organizer authentication
export async function POST(req: NextRequest) {
  try {
    // Verify the user is authenticated
    const { authorized, user, error } = await verifyAuth(req);
    
    if (!authorized || !user) {
      return unauthorized();
    }
    
    // Check if the user is an organizer
    if (!isRole(user, ['Organizer'])) {
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
    
    // Verify if the current user is the organizer of this event
    if (user.id !== ticket.event.organizerId) {
      return NextResponse.json(
        { success: false, message: 'Only the event organizer can check in attendees' },
        { status: 403 }
      );
    }

    if (ticket.checkIn) {
      // Already checked in, but return success for better UX
      return NextResponse.json(
        { 
          success: true, 
          message: 'Already checked in',
          checkIn: ticket.checkIn,
          ticket: {
            id: ticket.id,
            eventId: ticket.eventId,
            userId: ticket.userId,
          }
        },
        { status: 200 }
      );
    }

    const checkIn = await prisma.checkIn.create({
      data: {
        ticketId: ticket.id,
        status: 'Checked In',
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Check-in successful',
      checkIn,
      ticket: {
        id: ticket.id,
        eventId: ticket.eventId,
        userId: ticket.userId,
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 