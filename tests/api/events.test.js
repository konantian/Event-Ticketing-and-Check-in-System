const { createTestUser, createTestEvent, prisma } = require('../testUtils');
const { cleanupDatabase } = require('../setup');
const { eventHandlers } = require('../mocks/mockHandlers');
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const { expect } = require('chai');

// Create Express app for testing
function createApp() {
  const app = express();
  app.use(bodyParser.json());
  
  // Events routes
  app.get('/api/events', async (req, res) => {
    await eventHandlers.getEvents(req, res);
  });
  
  app.post('/api/events', async (req, res) => {
    await eventHandlers.createEvent(req, res);
  });
  
  app.get('/api/events/:id', async (req, res) => {
    await eventHandlers.getEvent(req, res);
  });
  
  app.put('/api/events/:id', async (req, res) => {
    await eventHandlers.updateEvent(req, res);
  });
  
  app.delete('/api/events/:id', async (req, res) => {
    await eventHandlers.deleteEvent(req, res);
  });
  
  return app;
}

describe('Events API', () => {
  // Create test app
  const app = createApp();
  
  // Clean up test data after each test
  afterEach(async () => {
    await cleanupDatabase();
  });

  describe('GET /api/events', () => {
    it('should return all events', async () => {
      // Create test user and events
      const organizer = await createTestUser({ role: 'Organizer' });
      const event1 = await createTestEvent(organizer.id);
      const event2 = await createTestEvent(organizer.id);
      
      const response = await request(app)
        .get('/api/events')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.events).to.exist;
      expect(Array.isArray(response.body.events)).to.be.true;
      expect(response.body.events.length).to.be.at.least(2);
      
      // Verify the events data
      const eventIds = response.body.events.map(e => e.id);
      expect(eventIds).to.include(event1.id);
      expect(eventIds).to.include(event2.id);
    });
  });
  
  describe('POST /api/events', () => {
    it('should create a new event', async () => {
      const organizer = await createTestUser({ role: 'Organizer' });
      
      const eventData = {
        name: 'Test New Event',
        description: 'This is a test event',
        capacity: 100,
        location: 'Test Location',
        startTime: new Date(Date.now() + 86400000).toISOString(), // tomorrow
        endTime: new Date(Date.now() + 172800000).toISOString(), // day after tomorrow
        organizerId: organizer.id
      };
      
      const response = await request(app)
        .post('/api/events')
        .send(eventData)
        .expect('Content-Type', /json/)
        .expect(201);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Event created successfully');
      expect(response.body.event).to.exist;
      expect(response.body.event.name).to.equal(eventData.name);
      expect(response.body.event.description).to.equal(eventData.description);
      expect(response.body.event.location).to.equal(eventData.location);
      expect(response.body.event.organizerId).to.equal(organizer.id);
      
      // Verify event in database
      const createdEvent = await prisma.event.findUnique({
        where: { id: response.body.event.id }
      });
      
      expect(createdEvent).to.not.be.null;
      expect(createdEvent.name).to.equal(eventData.name);
    });
    
    it('should return 400 if required fields are missing', async () => {
      const organizer = await createTestUser({ role: 'Organizer' });
      
      const response = await request(app)
        .post('/api/events')
        .send({
          name: 'Test Event',
          // Missing other required fields
          organizerId: organizer.id
        })
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Name, date, and organizerId are required');
    });
    
    it('should return 404 if organizer does not exist', async () => {
      const invalidOrganizerId = 999999; // Non-existent ID
      
      const eventData = {
        name: 'Test Event',
        description: 'This is a test event',
        capacity: 100,
        location: 'Test Location',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 172800000).toISOString(),
        organizerId: invalidOrganizerId
      };
      
      const response = await request(app)
        .post('/api/events')
        .send(eventData)
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Organizer not found');
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
      expect(response.body.event.description).to.equal(event.description);
    });
    
    it('should return 404 if event does not exist', async () => {
      const nonExistentId = 999999; // Non-existent ID
      
      const response = await request(app)
        .get(`/api/events/${nonExistentId}`)
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Event not found');
    });
  });
  
  describe('PUT /api/events/:id', () => {
    it('should update an event', async () => {
      const organizer = await createTestUser({ role: 'Organizer' });
      const event = await createTestEvent(organizer.id);
      
      const updatedData = {
        name: 'Updated Event Name',
        description: 'Updated event description'
      };
      
      const response = await request(app)
        .put(`/api/events/${event.id}`)
        .send(updatedData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Event updated successfully');
      expect(response.body.event).to.exist;
      expect(response.body.event.id).to.equal(event.id);
      expect(response.body.event.name).to.equal(updatedData.name);
      expect(response.body.event.description).to.equal(updatedData.description);
      
      // Verify update in database
      const updatedEvent = await prisma.event.findUnique({
        where: { id: event.id }
      });
      
      expect(updatedEvent.name).to.equal(updatedData.name);
      expect(updatedEvent.description).to.equal(updatedData.description);
    });
    
    it('should return 404 if event does not exist', async () => {
      const nonExistentId = 999999; // Non-existent ID
      
      const updatedData = {
        name: 'Updated Event Name',
        description: 'Updated event description'
      };
      
      const response = await request(app)
        .put(`/api/events/${nonExistentId}`)
        .send(updatedData)
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Event not found');
    });
  });
  
  describe('DELETE /api/events/:id', () => {
    it('should delete an event', async () => {
      const organizer = await createTestUser({ role: 'Organizer' });
      const event = await createTestEvent(organizer.id);
      
      const response = await request(app)
        .delete(`/api/events/${event.id}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Event deleted successfully');
      
      // Verify deletion in database
      const deletedEvent = await prisma.event.findUnique({
        where: { id: event.id }
      });
      
      expect(deletedEvent).to.be.null;
    });
    
    it('should return 404 if event does not exist', async () => {
      const nonExistentId = 999999; // Non-existent ID
      
      const response = await request(app)
        .delete(`/api/events/${nonExistentId}`)
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Event not found');
    });
  });
}); 