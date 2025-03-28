import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyAuth, unauthorized } from '@/app/lib/auth';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const ticketId = parseInt(id);
    
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ticket ID' },
        { status: 400 }
      );
    }

    const { authorized, user, error } = await verifyAuth(req);

    if (!authorized || !user) {
      return unauthorized();
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        checkIn: true,
        discount: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check if user is the ticket owner or an organizer/staff
    if (ticket.userId !== Number(user.id) && !['Organizer', 'Staff'].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to view this ticket' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error('Ticket fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 