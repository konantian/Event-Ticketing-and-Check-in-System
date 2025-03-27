const request = require('supertest');
const { expect } = require('chai');
const { cleanupDatabase } = require('../setup');
const { createTestUser, createTestEvent, createTestTicket } = require('../testUtils');
const { createTestServer } = require('../testServer');

describe('Check-in API', () => {
  let app;

  before(() => {
    app = createTestServer();
  });

  afterEach(async () => {
    await cleanupDatabase();
  });

  describe('POST /api/checkin', () => {
    it('should check in a ticket for staff or organizer', async () => {
      // Create test data
      const organizer = await createTestUser({ role: 'Organizer' });
      const attendee = await createTestUser({ role: 'Attendee' });
      const event = await createTestEvent(organizer.id);
      const ticket = await createTestTicket(attendee.id, event.id);
      const staff = await createTestUser({ role: 'Staff' });

      const response = await request(app)
        .post('/api/checkin')
        .set('x-test-auth-user', JSON.stringify({
          id: staff.id,
          email: staff.email,
          role: staff.role
        }))
        .send({ ticketId: ticket.id })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Ticket checked in successfully');
      expect(response.body.checkIn).to.exist;
      expect(response.body.checkIn.ticketId).to.equal(ticket.id);
      expect(response.body.checkIn.status).to.equal('Checked In');
    });

    it('should return 401 if user is not staff or organizer', async () => {
      const attendee = await createTestUser({ role: 'Attendee' });
      const organizer = await createTestUser({ role: 'Organizer' });
      const event = await createTestEvent(organizer.id);
      const ticket = await createTestTicket(attendee.id, event.id);

      const response = await request(app)
        .post('/api/checkin')
        .set('x-test-auth-user', JSON.stringify({
          id: attendee.id,
          email: attendee.email,
          role: attendee.role
        }))
        .send({ ticketId: ticket.id })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Unauthorized');
    });
  });

  describe('GET /api/checkin/status/:ticketId', () => {
    it('should return check-in status for ticket owner', async () => {
      // Create test data
      const organizer = await createTestUser({ role: 'Organizer' });
      const attendee = await createTestUser({ role: 'Attendee' });
      const event = await createTestEvent(organizer.id);
      const ticket = await createTestTicket(attendee.id, event.id);

      const response = await request(app)
        .get(`/api/checkin/status/${ticket.id}`)
        .set('x-test-auth-user', JSON.stringify({
          id: attendee.id,
          email: attendee.email,
          role: attendee.role
        }))
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.status).to.equal('Not Checked In');
    });

    it('should return check-in status for staff', async () => {
      // Create test data
      const organizer = await createTestUser({ role: 'Organizer' });
      const attendee = await createTestUser({ role: 'Attendee' });
      const event = await createTestEvent(organizer.id);
      const ticket = await createTestTicket(attendee.id, event.id);
      const staff = await createTestUser({ role: 'Staff' });

      const response = await request(app)
        .get(`/api/checkin/status/${ticket.id}`)
        .set('x-test-auth-user', JSON.stringify({
          id: staff.id,
          email: staff.email,
          role: staff.role
        }))
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.status).to.equal('Not Checked In');
    });

    it('should return 403 for unauthorized access', async () => {
      // Create test data
      const organizer = await createTestUser({ role: 'Organizer' });
      const attendee1 = await createTestUser({ role: 'Attendee' });
      const attendee2 = await createTestUser({ role: 'Attendee' });
      const event = await createTestEvent(organizer.id);
      const ticket = await createTestTicket(attendee1.id, event.id);

      const response = await request(app)
        .get(`/api/checkin/status/${ticket.id}`)
        .set('x-test-auth-user', JSON.stringify({
          id: attendee2.id,
          email: attendee2.email,
          role: attendee2.role
        }))
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Forbidden');
    });
  });
}); 