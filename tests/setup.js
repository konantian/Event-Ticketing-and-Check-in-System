const { prisma } = require('./testUtils');

/**
 * Cleans up test data from the database
 */
async function cleanupDatabase() {
  // Order matters due to foreign key constraints
  await prisma.checkIn.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.discount.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.user.deleteMany({});
}

module.exports = {
  cleanupDatabase
}; 