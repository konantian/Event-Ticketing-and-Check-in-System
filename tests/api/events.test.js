const request = require('supertest');
const { expect } = require('chai');
const { cleanupDatabase } = require('../setup');
const { createTestUser, createTestEvent } = require('../testUtils');
const { createTestServer } = require('../testServer');

describe('Events API', () => {
  let app;

  before(() => {
    app = createTestServer();
  });

  afterEach(async () => {
    await cleanupDatabase();
  });

  describe('GET /api/events', () => {
    it('should return all events', async () => {
      const organizer = await createTestUser({ role: 'Organizer' });
      const event = await createTestEvent(organizer.id);

      const response = await request(app)
        .get('/api/events')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.events).to.be.an('array');
      expect(response.body.events).to.have.lengthOf(1);
      expect(response.body.events[0].id).to.equal(event.id);
      expect(response.body.events[0].name).to.equal(event.name);
    });
  });

  describe('POST /api/events', () => {
    it('should create a new event', async () => {
      const organizer = await createTestUser({ role: 'Organizer' });

      const response = await request(app)
        .post('/api/events')
        .set('x-test-auth-user', JSON.stringify({
          id: organizer.id,
          email: organizer.email,
          role: organizer.role
        }))
        .send({
          name: 'Test Event',
          description: 'Test Description',
          capacity: 100,
          location: 'Test Location',
          startTime: '2024-04-01T10:00:00Z',
          endTime: '2024-04-01T18:00:00Z'
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).to.be.true;
      expect(response.body.event).to.exist;
      expect(response.body.event.name).to.equal('Test Event');
      expect(response.body.event.organizerId).to.equal(organizer.id);
    });

    it('should return 400 if required fields are missing', async () => {
      const organizer = await createTestUser({ role: 'Organizer' });

      const response = await request(app)
        .post('/api/events')
        .set('x-test-auth-user', JSON.stringify({
          id: organizer.id,
          email: organizer.email,
          role: organizer.role
        }))
        .send({
          name: 'Test Event'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Required fields missing');
    });

    it('should return 404 if organizer does not exist', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('x-test-auth-user', JSON.stringify({
          id: 999,
          email: 'nonexistent@example.com',
          role: 'Organizer'
        }))
        .send({
          name: 'Test Event',
          description: 'Test Description',
          capacity: 100,
          location: 'Test Location',
          startTime: '2024-04-01T10:00:00Z',
          endTime: '2024-04-01T18:00:00Z'
        })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).to.be.false;
    });
  });

  describe('GET /api/events/:id', () => {
    it('should return a specific event by ID', async () => {
      const organizer = await createTestUser({ role: 'Organizer' });
      const event = await createTestEvent(organizer.id);

      const response = await request(app)
        .get(`/api/events/${event.id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.event).to.exist;
      expect(response.body.event.id).to.equal(event.id);
      expect(response.body.event.name).to.equal(event.name);
    });

    it('should return 404 if event does not exist', async () => {
      const response = await request(app)
        .get('/api/events/999')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).to.be.false;
    });
  });

  describe('PUT /api/events/:id', () => {
    it('should update an event', async () => {
      const organizer = await createTestUser({ role: 'Organizer' });
      const event = await createTestEvent(organizer.id);

      const response = await request(app)
        .put(`/api/events/${event.id}`)
        .set('x-test-auth-user', JSON.stringify({
          id: organizer.id,
          email: organizer.email,
          role: organizer.role
        }))
        .send({
          name: 'Updated Event',
          description: 'Updated Description',
          capacity: 200,
          location: 'Updated Location',
          startTime: '2024-04-02T10:00:00Z',
          endTime: '2024-04-02T18:00:00Z'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.event).to.exist;
      expect(response.body.event.name).to.equal('Updated Event');
      expect(response.body.event.capacity).to.equal(200);
    });

    it('should return 404 if event does not exist', async () => {
      const organizer = await createTestUser({ role: 'Organizer' });

      const response = await request(app)
        .put('/api/events/999')
        .set('x-test-auth-user', JSON.stringify({
          id: organizer.id,
          email: organizer.email,
          role: organizer.role
        }))
        .send({
          name: 'Updated Event',
          description: 'Updated Description',
          capacity: 200,
          location: 'Updated Location',
          startTime: '2024-04-02T10:00:00Z',
          endTime: '2024-04-02T18:00:00Z'
        })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).to.be.false;
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should delete an event', async () => {
      const organizer = await createTestUser({ role: 'Organizer' });
      const event = await createTestEvent(organizer.id);

      const response = await request(app)
        .delete(`/api/events/${event.id}`)
        .set('x-test-auth-user', JSON.stringify({
          id: organizer.id,
          email: organizer.email,
          role: organizer.role
        }))
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Event deleted successfully');
    });

    it('should return 404 if event does not exist', async () => {
      const organizer = await createTestUser({ role: 'Organizer' });

      const response = await request(app)
        .delete('/api/events/999')
        .set('x-test-auth-user', JSON.stringify({
          id: organizer.id,
          email: organizer.email,
          role: organizer.role
        }))
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).to.be.false;
    });
  });
}); 