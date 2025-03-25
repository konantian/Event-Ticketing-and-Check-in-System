import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyAuth, unauthorized, forbidden, isRole } from '@/app/lib/auth';

interface Params {
  params: {
    id: string;
  };
}

// GET - Fetch a specific event
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid event ID' },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
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

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error('Event fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update a specific event (Organizer only)
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid event ID' },
        { status: 400 }
      );
    }

    // Verify authentication
    const { authorized, user, error } = await verifyAuth(req);

    if (!authorized) {
      return unauthorized();
    }

    // Check if event exists and user is the organizer
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.organizerId !== user.id && !isRole(user, ['Organizer'])) {
      return forbidden();
    }

    const body = await req.json();
    const { 
      name, 
      description, 
      capacity, 
      location, 
      startTime, 
      endTime 
    } = body;

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        name: name || event.name,
        description: description || event.description,
        capacity: capacity ? Number(capacity) : event.capacity,
        location: location || event.location,
        startTime: startTime ? new Date(startTime) : event.startTime,
        endTime: endTime ? new Date(endTime) : event.endTime,
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

// DELETE - Delete a specific event (Organizer only)
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid event ID' },
        { status: 400 }
      );
    }

    // Verify authentication
    const { authorized, user, error } = await verifyAuth(req);

    if (!authorized) {
      return unauthorized();
    }

    // Check if event exists and user is the organizer
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.organizerId !== user.id && !isRole(user, ['Organizer'])) {
      return forbidden();
    }

    // Delete event
    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Event deletion error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 