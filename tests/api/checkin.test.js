const request = require('supertest');
const { createServer } = require('http');
const { apiResolver } = require('next/dist/server/api-utils/node');
const { createTestUser, createTestEvent, createTestTicket, prisma } = require('../testUtils');
const { cleanupDatabase } = require('../setup');
const checkinHandler = require('../../app/api/checkin/route');
const checkinStatusHandler = require('../../app/api/checkin/status/route');

describe('Check-in API', () => {
  // Clean up database after each test
  afterEach(async () => {
    await cleanupDatabase();
  });

  describe('POST /api/checkin', () => {
    it('should check in a ticket for staff or organizer', async () => {
      // Create test data
      const organizer = await createTestUser('Organizer');
      const attendee = await createTestUser('Attendee');
      const event = await createTestEvent(organizer.id);
      const ticket = await createTestTicket(attendee.id, event.id);
      const staff = await createTestUser('Staff');
      
      const server = createServer((req, res) => {
        // Manually attach user for test
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: staff.id,
          email: staff.email,
          role: staff.role
        });
        
        return apiResolver(req, res, undefined, checkinHandler, {}, false);
      });
      
      const response = await request(server)
        .post('/')
        .send({ ticketId: ticket.id })
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Ticket checked in successfully');
      expect(response.body.checkIn).toBeDefined();
      expect(response.body.checkIn.ticketId).toBe(ticket.id);
      expect(response.body.checkIn.status).toBe('Checked In');
      
      // Verify check-in in database
      const checkIn = await prisma.checkIn.findUnique({
        where: { ticketId: ticket.id }
      });
      
      expect(checkIn).not.toBeNull();
      expect(checkIn.status).toBe('Checked In');
      
      server.close();
    });
    
    it('should return 401 if user is not authenticated', async () => {
      const attendee = await createTestUser('Attendee');
      const organizer = await createTestUser('Organizer');
      const event = await createTestEvent(organizer.id);
      const ticket = await createTestTicket(attendee.id, event.id);
      
      const server = createServer((req, res) => {
        return apiResolver(req, res, undefined, checkinHandler, {}, false);
      });
      
      const response = await request(server)
        .post('/')
        .send({ ticketId: ticket.id })
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      
      server.close();
    });
    
    it('should return 403 if user is not staff or organizer', async () => {
      const attendee = await createTestUser('Attendee');
      const organizer = await createTestUser('Organizer');
      const event = await createTestEvent(organizer.id);
      const ticket = await createTestTicket(attendee.id, event.id);
      
      const server = createServer((req, res) => {
        // Manually attach attendee user (not authorized for check-in)
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: attendee.id,
          email: attendee.email,
          role: attendee.role
        });
        
        return apiResolver(req, res, undefined, checkinHandler, {}, false);
      });
      
      const response = await request(server)
        .post('/')
        .send({ ticketId: ticket.id })
        .expect('Content-Type', /json/)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      
      server.close();
    });
    
    it('should return 404 if ticket does not exist', async () => {
      const staff = await createTestUser('Staff');
      
      const server = createServer((req, res) => {
        // Manually attach staff user
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: staff.id,
          email: staff.email,
          role: staff.role
        });
        
        return apiResolver(req, res, undefined, checkinHandler, {}, false);
      });
      
      const response = await request(server)
        .post('/')
        .send({ ticketId: 9999 }) // Non-existent ticket ID
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Ticket not found');
      
      server.close();
    });
    
    it('should return 400 if ticket is already checked in', async () => {
      // Create test data
      const organizer = await createTestUser('Organizer');
      const attendee = await createTestUser('Attendee');
      const event = await createTestEvent(organizer.id);
      const ticket = await createTestTicket(attendee.id, event.id);
      const staff = await createTestUser('Staff');
      
      // Create a check-in record first
      await prisma.checkIn.create({
        data: {
          ticketId: ticket.id,
          status: 'Checked In'
        }
      });
      
      const server = createServer((req, res) => {
        // Manually attach staff user
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: staff.id,
          email: staff.email,
          role: staff.role
        });
        
        return apiResolver(req, res, undefined, checkinHandler, {}, false);
      });
      
      const response = await request(server)
        .post('/')
        .send({ ticketId: ticket.id })
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Ticket already checked in');
      
      server.close();
    });
  });
  
  describe('GET /api/checkin/status', () => {
    it('should return status for a checked-in ticket', async () => {
      // Create test data
      const organizer = await createTestUser('Organizer');
      const attendee = await createTestUser('Attendee');
      const event = await createTestEvent(organizer.id);
      const ticket = await createTestTicket(attendee.id, event.id);
      
      // Create a check-in record
      await prisma.checkIn.create({
        data: {
          ticketId: ticket.id,
          status: 'Checked In'
        }
      });
      
      const server = createServer((req, res) => {
        // Manually attach user for test
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: attendee.id,
          email: attendee.email,
          role: attendee.role
        });
        
        return apiResolver(req, res, undefined, checkinStatusHandler, {}, false);
      });
      
      const response = await request(server)
        .get('/')
        .query({ ticketId: ticket.id })
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('Checked In');
      
      server.close();
    });
    
    it('should return Not Checked In for a ticket without check-in', async () => {
      // Create test data
      const organizer = await createTestUser('Organizer');
      const attendee = await createTestUser('Attendee');
      const event = await createTestEvent(organizer.id);
      const ticket = await createTestTicket(attendee.id, event.id);
      
      const server = createServer((req, res) => {
        // Manually attach user for test
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: attendee.id,
          email: attendee.email,
          role: attendee.role
        });
        
        return apiResolver(req, res, undefined, checkinStatusHandler, {}, false);
      });
      
      const response = await request(server)
        .get('/')
        .query({ ticketId: ticket.id })
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('Not Checked In');
      
      server.close();
    });
    
    it('should return 401 if user is not authenticated', async () => {
      const attendee = await createTestUser('Attendee');
      const organizer = await createTestUser('Organizer');
      const event = await createTestEvent(organizer.id);
      const ticket = await createTestTicket(attendee.id, event.id);
      
      const server = createServer((req, res) => {
        return apiResolver(req, res, undefined, checkinStatusHandler, {}, false);
      });
      
      const response = await request(server)
        .get('/')
        .query({ ticketId: ticket.id })
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      
      server.close();
    });
    
    it('should return 404 if ticket does not exist', async () => {
      const attendee = await createTestUser('Attendee');
      
      const server = createServer((req, res) => {
        // Manually attach user for test
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: attendee.id,
          email: attendee.email,
          role: attendee.role
        });
        
        return apiResolver(req, res, undefined, checkinStatusHandler, {}, false);
      });
      
      const response = await request(server)
        .get('/')
        .query({ ticketId: 9999 }) // Non-existent ticket ID
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Ticket not found');
      
      server.close();
    });
  });
}); 