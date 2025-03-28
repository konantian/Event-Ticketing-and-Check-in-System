import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyAuth, unauthorized } from '@/app/lib/auth';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const { authorized, user, error } = await verifyAuth(req);

    if (!authorized || !user) {
      return unauthorized();
    }

    // Get user's tickets
    const tickets = await prisma.ticket.findMany({
      where: { userId: Number(user.id) },
      include: {
        event: true,
        checkIn: true,
        discount: true,
      },
    });

    return NextResponse.json({
      success: true,
      tickets,
    });
  } catch (error) {
    console.error('Tickets fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Purchase a ticket for an event
export async function POST(req: NextRequest) {
  try {
    const { authorized, user, error } = await verifyAuth(req);

    if (!authorized || !user) {
      return unauthorized();
    }

    const body = await req.json();
    const { eventId, tier = 'General', discountCode } = body;

    if (!eventId) {
      return NextResponse.json(
        { success: false, message: 'Event ID is required' },
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

    // Check ticket capacity
    const ticketCount = await prisma.ticket.count({
      where: { eventId: Number(eventId) },
    });

    if (ticketCount >= event.capacity) {
      return NextResponse.json(
        { success: false, message: 'Event is sold out' },
        { status: 400 }
      );
    }

    // Set base price based on tier
    let price = tier === 'VIP' ? 100.0 : 50.0; // Example prices
    let discountValue = 0;
    let discountId = null;

    // Apply discount if provided
    if (discountCode) {
      const discount = await prisma.discount.findFirst({
        where: { code: discountCode },
      });

      if (discount) {
        if (discount.type === 'Percentage') {
          discountValue = price * (discount.value / 100);
        } else {
          discountValue = discount.value;
        }
        
        price -= discountValue;
        if (price < 0) price = 0;
        discountId = discount.id;

        // Update times used
        await prisma.discount.update({
          where: { id: discount.id },
          data: { timesUsed: { increment: 1 } },
        });
      }
    }

    // Generate QR code data (encrypted user and event data)
    const qrData = {
      userId: user.id,
      eventId: Number(eventId),
      timestamp: new Date().toISOString(),
    };
    
    const qrCodeData = crypto
      .createHash('sha256')
      .update(JSON.stringify(qrData))
      .digest('hex');

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        userId: Number(user.id),
        eventId: Number(eventId),
        price,
        tier,
        qrCodeData,
        discountCodeId: discountId,
      },
      include: {
        event: true,
        discount: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Ticket purchased successfully',
        ticket,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Ticket purchase error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 