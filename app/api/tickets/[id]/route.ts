import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyAuth, unauthorized } from '@/app/lib/auth';

interface Params {
  params: {
    id: string;
  };
}

// GET - Get details of a specific ticket
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ticket ID' },
        { status: 400 }
      );
    }

    // Verify authentication
    const { authorized, user, error } = await verifyAuth(req);

    if (!authorized) {
      return unauthorized();
    }

    // Get ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id },
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
    if (ticket.userId !== user.id && !['Organizer', 'Staff'].includes(user.role)) {
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