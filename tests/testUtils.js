const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Initialize Prisma client with test configuration
const prisma = new PrismaClient();

/**
 * Creates a test user in the database
 * @param {Object} userParams - User parameters including role
 * @returns {Promise<Object>} The created user object
 */
async function createTestUser(userParams = {}) {
  const defaultParams = {
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    role: 'Attendee'
  };

  const userData = { ...defaultParams, ...userParams };
  
  // Hash the password
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  // Create the user in the database
  const user = await prisma.user.create({
    data: {
      email: userData.email,
      password: hashedPassword,
      role: userData.role
    }
  });
  
  return user;
}

/**
 * Creates a test event in the database
 * @param {string} organizerId - ID of the organizer user
 * @param {Object} eventParams - Optional event parameters
 * @returns {Promise<Object>} The created event object
 */
async function createTestEvent(organizerId, eventParams = {}) {
  const now = Date.now();
  const defaultParams = {
    name: `Test Event ${now}`,
    description: 'This is a test event description',
    capacity: 100,
    location: 'Test Location',
    startTime: new Date(now + 86400000), // tomorrow
    endTime: new Date(now + 172800000) // day after tomorrow
  };

  const eventData = { ...defaultParams, ...eventParams };
  
  // Create the event in the database
  const event = await prisma.event.create({
    data: {
      name: eventData.name,
      description: eventData.description,
      capacity: eventData.capacity,
      location: eventData.location,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      organizerId
    }
  });
  
  return event;
}

/**
 * Creates a test ticket in the database
 * @param {string} userId - ID of the ticket owner
 * @param {string} eventId - ID of the event
 * @param {string} tier - Ticket tier
 * @param {number} price - Ticket price
 * @returns {Promise<Object>} The created ticket object
 */
async function createTestTicket(userId, eventId, tier = 'General', price = 10.0) {
  const qrCodeData = crypto.createHash('sha256')
    .update(`${userId}-${eventId}-${Date.now()}`)
    .digest('hex');
  
  const ticket = await prisma.ticket.create({
    data: {
      userId,
      eventId,
      tier,
      price,
      qrCodeData
    }
  });
  
  return ticket;
}

/**
 * Creates a test discount in the database
 * @param {string} code - Discount code
 * @param {string} type - Discount type
 * @param {number} value - Discount value
 * @returns {Promise<Object>} The created discount object
 */
async function createTestDiscount(code = null, type = 'Percentage', value = 10) {
  const discountCode = code || `DISC-${Date.now()}`;
  
  const discount = await prisma.discount.create({
    data: {
      code: discountCode,
      type,
      value,
      timesUsed: 0
    }
  });
  
  return discount;
}

// Simple function to attach user context to request
function attachUserToRequest(req, user) {
  // Add user context directly to request object
  req.user = {
    id: user.id,
    email: user.email,
    role: user.role
  };
  
  return req;
}

module.exports = {
  createTestUser,
  createTestEvent,
  createTestTicket,
  createTestDiscount,
  attachUserToRequest,
  prisma
}; 