import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyAuth, unauthorized } from '@/app/lib/auth';
import crypto from 'crypto';

// GET - List tickets for the user
export async function GET(req: NextRequest) {
  try {
    const { authorized, user } = await verifyAuth(req);
    if (!authorized || !user) return unauthorized();

    const tickets = await prisma.ticket.findMany({
      where: { userId: Number(user.id) },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
            location: true,
            price: true, 
          }
        },
        checkIn: true,
        discount: true,
      },
    });

    return NextResponse.json({ success: true, tickets });
  } catch (error) {
    console.error('Tickets fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Purchase a ticket
export async function POST(req: NextRequest) {
  try {
    const { authorized, user } = await verifyAuth(req);
    if (!authorized || !user) return unauthorized();

    const { eventId, tier = 'General', discountCode } = await req.json();

    if (!eventId) {
      return NextResponse.json(
        { success: false, message: 'Event ID is required' },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.remaining <= 0) {
      return NextResponse.json(
        { success: false, message: 'Event is sold out' },
        { status: 400 }
      );
    }

    // Calculate base price from event
    if (event.price == null) {
      return NextResponse.json(
        { success: false, message: 'Event price is not set' },
        { status: 500 }
      );
    }

    let price = event.price;
    if (tier === 'VIP') {
      price = event.price * 1.5;
    }

    let discountValue = 0;
    let discountId = null;

    if (discountCode) {
      const discount = await prisma.discount.findFirst({
        where: { code: discountCode },
      });

      if (discount) {
        discountValue =
          discount.type === 'Percentage'
            ? price * (discount.value / 100)
            : discount.value;

        price = Math.max(0, price - discountValue);
        discountId = discount.id;

        await prisma.discount.update({
          where: { id: discount.id },
          data: { timesUsed: { increment: 1 } },
        });
      }
    }

    const qrCodeData = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          userId: user.id,
          eventId,
          timestamp: new Date().toISOString(),
        })
      )
      .digest('hex');

    const ticket = await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id: Number(eventId) },
        data: { remaining: { decrement: 1 } },
      });

      return await tx.ticket.create({
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
