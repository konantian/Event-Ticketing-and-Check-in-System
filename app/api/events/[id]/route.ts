import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyAuth, unauthorized, forbidden, isRole } from '@/app/lib/auth';

// ✅ GET /api/events/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id, 10);

    if (isNaN(eventId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid event ID' },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        description: true,
        location: true,
        capacity: true,
        remaining: true,
        startTime: true,
        endTime: true,
        createdAt: true,
        updatedAt: true,
        price: true,
        organizer: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Event fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ✅ PUT /api/events/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { authorized, user } = await verifyAuth(req);
    if (!authorized || !user) return unauthorized();
    if (!isRole(user, ['Organizer'])) return forbidden();

    const eventId = parseInt(params.id, 10);
    if (isNaN(eventId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid event ID' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      name,
      description,
      location,
      capacity,
      price,
      startTime,
      endTime,
    } = body;

    if (!name || !description || !location || !capacity || !price || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        name,
        description,
        location,
        capacity: Number(capacity),
        price: Number(price),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent,
    });
  } catch (error) {
    console.error('Event update error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
