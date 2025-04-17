import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyAuth } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = authResult.user.id;

    // Get ticket ID from request body - use the body from authResult if available
    // to avoid double-parsing the request body
    let ticketId;
    
    if (authResult.body && 'ticketId' in authResult.body) {
      ticketId = authResult.body.ticketId;
    } else {
      // If not available, parse it now - create a clone to avoid consuming the original stream
      const clonedRequest = request.clone();
      try {
        const body = await clonedRequest.json();
        ticketId = body.ticketId;
      } catch (error) {
        console.error('Failed to parse request body', error);
        return NextResponse.json({ message: 'Invalid request - missing ticketId' }, { status: 400 });
      }
    }

    if (!ticketId) {
      return NextResponse.json({ message: 'Ticket ID is required' }, { status: 400 });
    }

    // Find the ticket
    const ticket = await prisma.ticket.findUnique({
      where: {
        id: Number(ticketId),
      },
      include: {
        event: true,
        checkIn: true
      }
    });

    // Check if ticket exists
    if (!ticket) {
      return NextResponse.json({ message: 'Ticket not found' }, { status: 404 });
    }

    // Check if the ticket belongs to the authenticated user
    if (ticket.userId !== Number(userId)) {
      return NextResponse.json({ message: 'Unauthorized to refund this ticket' }, { status: 403 });
    }

    // Check if the ticket is already checked in
    if (ticket.checkIn) {
      return NextResponse.json({ message: 'Cannot refund a ticket that has been checked in' }, { status: 400 });
    }

    // Check if the event has already started
    const now = new Date();
    if (new Date(ticket.event.startTime) < now) {
      return NextResponse.json({ message: 'Cannot refund tickets for events that have already started' }, { status: 400 });
    }

    // Process the refund (in a real app, you would also handle payment refund through Stripe or other payment processor)
    
    // Increase the event's remaining ticket count
    await prisma.event.update({
      where: { id: ticket.eventId },
      data: { remaining: { increment: 1 } }
    });
    
    // Delete the ticket
    await prisma.ticket.delete({
      where: {
        id: Number(ticketId),
      },
    });

    // Return success response
    return NextResponse.json({ message: 'Ticket refunded successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error refunding ticket:', error);
    return NextResponse.json(
      { message: 'Failed to process refund' },
      { status: 500 }
    );
  }
} 