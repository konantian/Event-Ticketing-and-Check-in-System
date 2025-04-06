import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('test1234', 10);

  // Upsert users to avoid duplicate email issues
  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@example.com' },
    update: {},
    create: {
      email: 'organizer@example.com',
      password: hashedPassword,
      role: 'Organizer',
    },
  });

  const attendee = await prisma.user.upsert({
    where: { email: 'attendee@example.com' },
    update: {},
    create: {
      email: 'attendee@example.com',
      password: hashedPassword,
      role: 'Attendee',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@example.com' },
    update: {},
    create: {
      email: 'staff@example.com',
      password: hashedPassword,
      role: 'Staff',
    },
  });

  // Create sample events
  const eventData = [
    {
      organizerId: organizer.id,
      name: 'Tech Conference 2025',
      description: 'A full-day conference on emerging technologies.',
      capacity: 300,
      remaining: 300,
      location: 'Toronto Convention Centre',
      startTime: new Date('2025-06-15T09:00:00Z'),
      endTime: new Date('2025-06-15T17:00:00Z'),
    },
    {
      organizerId: organizer.id,
      name: 'Startup Pitch Night',
      description: 'Startups pitching their ideas to VCs and the public.',
      capacity: 150,
      remaining: 150,
      location: 'Downtown Hub',
      startTime: new Date('2025-07-01T18:00:00Z'),
      endTime: new Date('2025-07-01T21:00:00Z'),
    },
    {
      organizerId: organizer.id,
      name: 'Developer Bootcamp',
      description: 'A hands-on workshop for junior devs',
      capacity: 80,
      remaining: 80,
      location: 'UofT Campus',
      startTime: new Date('2025-05-10T10:00:00Z'),
      endTime: new Date('2025-05-10T16:00:00Z'),
    },
  ];

  const events = [];
  for (const event of eventData) {
    const existingEvent = await prisma.event.findFirst({
      where: { name: event.name },
    });

    if (existingEvent) {
      const updatedEvent = await prisma.event.update({
        where: { id: existingEvent.id },
        data: event,
      });
      events.push(updatedEvent);
    } else {
      const createdEvent = await prisma.event.create({
        data: event,
      });
      events.push(createdEvent);
    }
  }

  // Create discounts
  const discount1 = await prisma.discount.upsert({
    where: { code: 'SUMMER20' },
    update: {},
    create: {
      code: 'SUMMER20',
      type: 'Percentage',
      value: 20,
    },
  });

  const discount2 = await prisma.discount.upsert({
    where: { code: 'EARLYBIRD10' },
    update: {},
    create: {
      code: 'EARLYBIRD10',
      type: 'Fixed Amount',
      value: 10,
    },
  });

  // Create tickets with prices defined here
  const ticketData = [
    {
      userId: attendee.id,
      eventId: events[0].id, // Tech Conference 2025
      price: 100,
      tier: 'General',
      qrCodeData: 'TICKET1',
      discountCodeId: discount1.id,
    },
    {
      userId: attendee.id,
      eventId: events[1].id, // Startup Pitch Night
      price: 50,
      tier: 'VIP',
      qrCodeData: 'TICKET2',
    },
    {
      userId: attendee.id,
      eventId: events[2].id, // Developer Bootcamp
      price: 20,
      tier: 'General',
      qrCodeData: 'TICKET3',
      discountCodeId: discount2.id,
    },
  ];

  const createdTickets = [];
  for (const ticket of ticketData) {
    const existingTicket = await prisma.ticket.findFirst({
      where: { qrCodeData: ticket.qrCodeData },
    });

    if (existingTicket) {
      const updatedTicket = await prisma.ticket.update({
        where: { id: existingTicket.id },
        data: ticket,
      });
      createdTickets.push(updatedTicket);
    } else {
      const createdTicket = await prisma.ticket.create({
        data: ticket,
      });
      createdTickets.push(createdTicket);
    }
  }

  // Create check-ins
  if (createdTickets[0]) {
    await prisma.checkIn.upsert({
      where: { ticketId: createdTickets[0].id },
      update: {},
      create: {
        ticketId: createdTickets[0].id,
        status: 'Checked In',
        timestamp: new Date(),
      },
    });
  }

  if (createdTickets[1]) {
    await prisma.checkIn.upsert({
      where: { ticketId: createdTickets[1].id },
      update: {},
      create: {
        ticketId: createdTickets[1].id,
        status: 'Not Checked In',
        timestamp: new Date(),
      },
    });
  }

  console.log('Seeded users, events, discounts, tickets, and check-ins!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
