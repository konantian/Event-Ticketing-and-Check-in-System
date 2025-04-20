import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('test1234', 10);

  // Create sample users
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

  console.log('Users created or updated successfully: Organizer, Attendee');

  // Create sample events
  const event1 = await prisma.event.upsert({
    where: { id: 1 },
    update: {
      name: 'Tech Conference 2025',
      description: 'A full-day conference on emerging technologies.',
      capacity: 300,
      remaining: 300,
      location: 'Toronto Convention Centre',
      startTime: new Date('2025-06-15T09:00:00Z'),
      endTime: new Date('2025-06-15T17:00:00Z'),
      price: 100, 
    },
    create: {
      name: 'Tech Conference 2025',
      description: 'A full-day conference on emerging technologies.',
      capacity: 300,
      remaining: 300,
      location: 'Toronto Convention Centre',
      startTime: new Date('2025-06-15T09:00:00Z'),
      endTime: new Date('2025-06-15T17:00:00Z'),
      price: 100,
      organizer: {
        connect: { id: organizer.id }
      }
    },
  });

  const event2 = await prisma.event.upsert({
    where: { id: 2 },
    update: {
      name: 'Startup Pitch Night',
      description: 'Startups pitching their ideas to VCs and the public.',
      capacity: 150,
      remaining: 150,
      location: 'Downtown Hub',
      startTime: new Date('2025-07-01T18:00:00Z'),
      endTime: new Date('2025-07-01T21:00:00Z'),
      price: 50, 
    },
    create: {
      name: 'Startup Pitch Night',
      description: 'Startups pitching their ideas to VCs and the public.',
      capacity: 150,
      remaining: 150,
      location: 'Downtown Hub',
      startTime: new Date('2025-07-01T18:00:00Z'),
      endTime: new Date('2025-07-01T21:00:00Z'),
      price: 50,
      organizer: {
        connect: { id: organizer.id }
      }
    },
  });

  const event3 = await prisma.event.upsert({
    where: { id: 3 },
    update: {
      name: 'Developer Bootcamp',
      description: 'A hands-on workshop for junior devs',
      capacity: 80,
      remaining: 80,
      location: 'UofT Campus',
      startTime: new Date('2025-05-10T10:00:00Z'),
      endTime: new Date('2025-05-10T16:00:00Z'),
      price: 20,
    },
    create: {
      name: 'Developer Bootcamp',
      description: 'A hands-on workshop for junior devs',
      capacity: 80,
      remaining: 80,
      location: 'UofT Campus',
      startTime: new Date('2025-05-10T10:00:00Z'),
      endTime: new Date('2025-05-10T16:00:00Z'),
      price: 20,
      organizer: {
        connect: { id: organizer.id }
      }
    },
  });

  console.log('Events created successfully');

  // Create discount
  await prisma.discount.upsert({
    where: { code: 'DISCOUNT20' },
    update: {},
    create: {
      code: 'DISCOUNT20',
      type: 'Percentage',
      value: 20,
      timesUsed: 0,
    },
  });

  console.log('Discount code created');

  // Create tickets
  for (const ticketData of [
    {
      userId: attendee.id,
      eventId: event1.id,
      price: 100,
      tier: 'General',
      qrCodeData: `ticket-event1-${Date.now()}-1`,
    },
    {
      userId: attendee.id,
      eventId: event2.id,
      price: 50,
      tier: 'VIP',
      qrCodeData: `ticket-event2-${Date.now()}-2`,
    },
    {
      userId: attendee.id,
      eventId: event3.id,
      price: 20,
      tier: 'General',
      qrCodeData: `ticket-event3-${Date.now()}-3`,
    },
  ]) {
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        userId: ticketData.userId,
        eventId: ticketData.eventId,
      },
    });

    if (!existingTicket) {
      await prisma.ticket.create({ data: ticketData });
    }
  }

  console.log('Tickets created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
