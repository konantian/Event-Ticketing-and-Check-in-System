import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyAuth, unauthorized, forbidden, isRole } from '@/app/lib/auth';

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
    const { authorized, user, error } = await verifyAuth(req);

    if (!authorized || !user) {
      return unauthorized();
    }

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

    if (!name || !description || !capacity || !location || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        name,
        description,
        capacity: Number(capacity),
        location,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        organizerId: Number(user.id),
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