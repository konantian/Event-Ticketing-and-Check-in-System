import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('test1234', 10);

  await prisma.user.create({
    data: {
      email: 'organizer@example.com',
      password: hashedPassword,
      role: 'Organizer',
    },
  });

  await prisma.user.create({
    data: {
      email: 'attendee@example.com',
      password: hashedPassword,
      role: 'Attendee',
    },
  });

  console.log('Seeded users!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
