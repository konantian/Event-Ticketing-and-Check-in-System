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
    await prisma.event.createMany({
    data: [
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
    ],
});

  console.log('Seeded users and events!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
