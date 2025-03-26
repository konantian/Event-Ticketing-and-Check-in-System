import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyAuth, unauthorized, forbidden, isRole } from '@/app/lib/auth';

// GET - List all events
export async function GET(req: NextRequest) {
  try {
    const events = await prisma.event.findMany({
      include: {
        organizer: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error('Events fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new event (Organizer only)
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const { authorized, user, error } = await verifyAuth(req);

    if (!authorized || !user) {
      return unauthorized();
    }

    // Check if user is an organizer
    if (!isRole(user, ['Organizer'])) {
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

    // Validate input
    if (!name || !description || !capacity || !location || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        name,
        description,
        capacity: Number(capacity),
        location,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        organizerId: user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Event created successfully',
        event,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Event creation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 