import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyAuth, unauthorized, forbidden, isRole } from '@/app/lib/auth';

// GET - Get check-in status for an event
export async function GET(req: NextRequest) {
  try {
    // Verify authentication (only Staff and Organizers can view check-in status)
    const { authorized, user, error } = await verifyAuth(req);

    if (!authorized) {
      return unauthorized();
    }

    if (!isRole(user, ['Organizer', 'Staff'])) {
      return forbidden();
    }

    const eventId = req.nextUrl.searchParams.get('eventId');
    
    if (!eventId || isNaN(Number(eventId))) {
      return NextResponse.json(
        { success: false, message: 'Valid event ID is required' },
        { status: 400 }
      );
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event not found' },
        { status: 404 }
      );
    }

    // Get check-in statistics
    const totalTickets = await prisma.ticket.count({
      where: { eventId: Number(eventId) },
    });

    const checkedInTickets = await prisma.ticket.count({
      where: { 
        eventId: Number(eventId),
        checkIn: {
          isNot: null,
        },
      },
    });

    // Get list of checked-in attendees
    const checkedInAttendees = await prisma.ticket.findMany({
      where: { 
        eventId: Number(eventId),
        checkIn: {
          isNot: null,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        checkIn: true,
      },
      orderBy: {
        checkIn: {
          timestamp: 'desc',
        },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalTickets,
        checkedInTickets,
        checkedInPercentage: totalTickets > 0 ? (checkedInTickets / totalTickets) * 100 : 0,
      },
      checkedInAttendees,
    });
  } catch (error) {
    console.error('Check-in status error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 