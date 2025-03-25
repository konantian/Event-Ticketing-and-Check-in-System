const request = require('supertest');
const { createServer } = require('http');
const { apiResolver } = require('next/dist/server/api-utils/node');
const { createTestUser, createTestEvent, createTestTicket, prisma } = require('../testUtils');
const { cleanupDatabase } = require('../setup');
const ticketsHandler = require('../../app/api/tickets/route');
const ticketByIdHandler = require('../../app/api/tickets/[id]/route');

describe('Tickets API', () => {
  // Clean up database after each test
  afterEach(async () => {
    await cleanupDatabase();
  });

  describe('GET /api/tickets', () => {
    it('should return all tickets for admin/staff', async () => {
      // Create test data
      const organizer = await createTestUser('Organizer');
      const attendee = await createTestUser('Attendee');
      const event = await createTestEvent(organizer.id);
      const ticket1 = await createTestTicket(attendee.id, event.id);
      const ticket2 = await createTestTicket(attendee.id, event.id);
      
      // Create a staff user for authorization
      const staff = await createTestUser('Staff');
      
      const server = createServer((req, res) => {
        // Manually attach user for test
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: staff.id,
          email: staff.email,
          role: staff.role
        });
        
        return apiResolver(req, res, undefined, ticketsHandler, {}, false);
      });
      
      const response = await request(server)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.tickets).toBeDefined();
      expect(Array.isArray(response.body.tickets)).toBe(true);
      expect(response.body.tickets.length).toBeGreaterThanOrEqual(2);
      
      // Verify the tickets data
      const ticketIds = response.body.tickets.map(t => t.id);
      expect(ticketIds).toContain(ticket1.id);
      expect(ticketIds).toContain(ticket2.id);
      
      server.close();
    });
    
    it('should return only user\'s tickets for attendees', async () => {
      // Create test data
      const organizer = await createTestUser('Organizer');
      const attendee1 = await createTestUser('Attendee');
      const attendee2 = await createTestUser('Attendee');
      const event = await createTestEvent(organizer.id);
      
      // Create tickets for different attendees
      const ticket1 = await createTestTicket(attendee1.id, event.id);
      const ticket2 = await createTestTicket(attendee1.id, event.id);
      const ticket3 = await createTestTicket(attendee2.id, event.id);
      
      const server = createServer((req, res) => {
        // Manually attach user for test
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: attendee1.id,
          email: attendee1.email,
          role: attendee1.role
        });
        
        return apiResolver(req, res, undefined, ticketsHandler, {}, false);
      });
      
      const response = await request(server)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.tickets).toBeDefined();
      expect(Array.isArray(response.body.tickets)).toBe(true);
      expect(response.body.tickets.length).toBe(2); // Only attendee1's tickets
      
      // Verify only attendee1's tickets are returned
      const ticketIds = response.body.tickets.map(t => t.id);
      expect(ticketIds).toContain(ticket1.id);
      expect(ticketIds).toContain(ticket2.id);
      expect(ticketIds).not.toContain(ticket3.id);
      
      server.close();
    });
    
    it('should return 401 if user is not authenticated', async () => {
      const server = createServer((req, res) => {
        return apiResolver(req, res, undefined, ticketsHandler, {}, false);
      });
      
      const response = await request(server)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      
      server.close();
    });
  });
  
  describe('POST /api/tickets', () => {
    it('should create a new ticket for a user', async () => {
      const attendee = await createTestUser('Attendee');
      const organizer = await createTestUser('Organizer');
      const event = await createTestEvent(organizer.id);
      
      const server = createServer((req, res) => {
        // Manually attach user for test
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: attendee.id,
          email: attendee.email,
          role: attendee.role
        });
        
        return apiResolver(req, res, undefined, ticketsHandler, {}, false);
      });
      
      const ticketData = {
        eventId: event.id,
        tier: 'VIP',
        price: 25.0
      };
      
      const response = await request(server)
        .post('/')
        .send(ticketData)
        .expect('Content-Type', /json/)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Ticket purchased successfully');
      expect(response.body.ticket).toBeDefined();
      expect(response.body.ticket.tier).toBe(ticketData.tier);
      expect(response.body.ticket.price).toBe(ticketData.price);
      expect(response.body.ticket.userId).toBe(attendee.id);
      expect(response.body.ticket.eventId).toBe(event.id);
      expect(response.body.ticket.qrCodeData).toBeDefined();
      
      // Verify ticket in database
      const createdTicket = await prisma.ticket.findUnique({
        where: { id: response.body.ticket.id }
      });
      
      expect(createdTicket).not.toBeNull();
      expect(createdTicket.tier).toBe(ticketData.tier);
      expect(createdTicket.userId).toBe(attendee.id);
      
      server.close();
    });
    
    it('should return 401 if user is not authenticated', async () => {
      const organizer = await createTestUser('Organizer');
      const event = await createTestEvent(organizer.id);
      
      const server = createServer((req, res) => {
        return apiResolver(req, res, undefined, ticketsHandler, {}, false);
      });
      
      const ticketData = {
        eventId: event.id,
        tier: 'General',
        price: 10.0
      };
      
      const response = await request(server)
        .post('/')
        .send(ticketData)
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      
      server.close();
    });
    
    it('should return 400 if required fields are missing', async () => {
      const attendee = await createTestUser('Attendee');
      
      const server = createServer((req, res) => {
        // Manually attach user for test
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: attendee.id,
          email: attendee.email,
          role: attendee.role
        });
        
        return apiResolver(req, res, undefined, ticketsHandler, {}, false);
      });
      
      const response = await request(server)
        .post('/')
        .send({
          tier: 'General'
          // Missing eventId
        })
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      
      server.close();
    });
  });

  describe('GET /api/tickets/[id]', () => {
    it('should return a specific ticket by ID for the ticket owner', async () => {
      const attendee = await createTestUser('Attendee');
      const organizer = await createTestUser('Organizer');
      const event = await createTestEvent(organizer.id);
      const ticket = await createTestTicket(attendee.id, event.id);
      
      const server = createServer((req, res) => {
        // Manually attach user for test
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: attendee.id,
          email: attendee.email,
          role: attendee.role
        });
        
        return apiResolver(
          req, 
          res, 
          { id: ticket.id.toString() }, 
          ticketByIdHandler, 
          {}, 
          false
        );
      });
      
      const response = await request(server)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.ticket).toBeDefined();
      expect(response.body.ticket.id).toBe(ticket.id);
      expect(response.body.ticket.userId).toBe(attendee.id);
      expect(response.body.ticket.eventId).toBe(event.id);
      
      server.close();
    });
    
    it('should return a specific ticket by ID for staff/organizer', async () => {
      const attendee = await createTestUser('Attendee');
      const organizer = await createTestUser('Organizer');
      const staff = await createTestUser('Staff');
      const event = await createTestEvent(organizer.id);
      const ticket = await createTestTicket(attendee.id, event.id);
      
      const server = createServer((req, res) => {
        // Manually attach user for test
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: staff.id,
          email: staff.email,
          role: staff.role
        });
        
        return apiResolver(
          req, 
          res, 
          { id: ticket.id.toString() }, 
          ticketByIdHandler, 
          {}, 
          false
        );
      });
      
      const response = await request(server)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.ticket).toBeDefined();
      expect(response.body.ticket.id).toBe(ticket.id);
      
      server.close();
    });
    
    it('should return 403 if user is not authorized to view ticket', async () => {
      const attendee1 = await createTestUser('Attendee');
      const attendee2 = await createTestUser('Attendee');
      const organizer = await createTestUser('Organizer');
      const event = await createTestEvent(organizer.id);
      const ticket = await createTestTicket(attendee1.id, event.id);
      
      const server = createServer((req, res) => {
        // Manually attach user for test (different attendee)
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: attendee2.id,
          email: attendee2.email,
          role: attendee2.role
        });
        
        return apiResolver(
          req, 
          res, 
          { id: ticket.id.toString() }, 
          ticketByIdHandler, 
          {}, 
          false
        );
      });
      
      const response = await request(server)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      
      server.close();
    });
    
    it('should return 404 if ticket does not exist', async () => {
      const staff = await createTestUser('Staff');
      
      const server = createServer((req, res) => {
        // Manually attach user for test
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: staff.id,
          email: staff.email,
          role: staff.role
        });
        
        return apiResolver(
          req, 
          res, 
          { id: '9999' }, // Non-existent ID
          ticketByIdHandler, 
          {}, 
          false
        );
      });
      
      const response = await request(server)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Ticket not found');
      
      server.close();
    });
  });
}); 