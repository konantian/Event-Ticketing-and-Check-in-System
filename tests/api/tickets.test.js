const request = require('supertest');
const { expect } = require('chai');
const { cleanupDatabase } = require('../setup');
const { createTestUser, createTestEvent, createTestTicket } = require('../testUtils');
const { createTestServer } = require('../testServer');

describe('Tickets API', () => {
  let app;

  before(() => {
    app = createTestServer();
  });

  afterEach(async () => {
    await cleanupDatabase();
  });

  describe('GET /api/tickets', () => {
    it('should return all tickets for admin/staff', async () => {
      // Create test data
      const organizer = await createTestUser({ role: 'Organizer' });
      const attendee = await createTestUser({ role: 'Attendee' });
      const event = await createTestEvent(organizer.id);
      const ticket = await createTestTicket(attendee.id, event.id);
      const staff = await createTestUser({ role: 'Staff' });

      const response = await request(app)
        .get('/api/tickets')
        .set('x-test-auth-user', JSON.stringify({
          id: staff.id,
          email: staff.email,
          role: staff.role
        }))
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.tickets).to.be.an('array');
      expect(response.body.tickets).to.have.lengthOf(1);
      expect(response.body.tickets[0].id).to.equal(ticket.id);
      expect(response.body.tickets[0].userId).to.equal(attendee.id);
      expect(response.body.tickets[0].eventId).to.equal(event.id);
    });

    it('should return 401 if user is not authenticated', async () => {
      const response = await request(app)
        .get('/api/tickets')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Unauthorized');
    });
  });

  describe('POST /api/tickets', () => {
    it('should create a new ticket for a user', async () => {
      const attendee = await createTestUser({ role: 'Attendee' });
      const organizer = await createTestUser({ role: 'Organizer' });
      const event = await createTestEvent(organizer.id);

      const response = await request(app)
        .post('/api/tickets')
        .set('x-test-auth-user', JSON.stringify({
          id: attendee.id,
          email: attendee.email,
          role: attendee.role
        }))
        .send({
          eventId: event.id,
          price: 50.00,
          tier: 'General'
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).to.be.true;
      expect(response.body.ticket).to.exist;
      expect(response.body.ticket.userId).to.equal(attendee.id);
      expect(response.body.ticket.eventId).to.equal(event.id);
      expect(response.body.ticket.price).to.equal(50.00);
      expect(response.body.ticket.tier).to.equal('General');
      expect(response.body.ticket.qrCodeData).to.be.a('string');
    });

    it('should return 401 if user is not authenticated', async () => {
      const organizer = await createTestUser({ role: 'Organizer' });
      const event = await createTestEvent(organizer.id);

      const response = await request(app)
        .post('/api/tickets')
        .send({
          eventId: event.id,
          price: 50.00,
          tier: 'General'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Unauthorized');
    });

    it('should return 400 if required fields are missing', async () => {
      const attendee = await createTestUser({ role: 'Attendee' });

      const response = await request(app)
        .post('/api/tickets')
        .set('x-test-auth-user', JSON.stringify({
          id: attendee.id,
          email: attendee.email,
          role: attendee.role
        }))
        .send({
          price: 50.00
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Required fields missing');
    });
  });
}); 