const { createTestUser } = require('../testUtils');
const { cleanupDatabase } = require('../setup');
const { authHandlers, prisma } = require('../mocks/mockHandlers');
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const { expect } = require('chai');

// Create Express app for testing
function createApp() {
  const app = express();
  app.use(bodyParser.json());
  
  // Register route
  app.post('/api/register', async (req, res) => {
    await authHandlers.register(req, res);
  });
  
  // Login route
  app.post('/api/login', async (req, res) => {
    await authHandlers.login(req, res);
  });
  
  return app;
}

describe('Authentication API', () => {
  // Create test app
  const app = createApp();
  
  // Clean up test data after each test
  afterEach(async () => {
    await cleanupDatabase();
  });

  describe('POST /api/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'testpassword123',
        role: 'Attendee'
      };
      
      const response = await request(app)
        .post('/api/register')
        .send(userData)
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('User registered successfully');
      expect(response.body.user).to.exist;
      expect(response.body.user.email).to.equal(userData.email);
      expect(response.body.user.role).to.equal(userData.role);
      
      // Verify user in database
      const createdUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      expect(createdUser).to.not.be.null;
      expect(createdUser.email).to.equal(userData.email);
      expect(createdUser.role).to.equal(userData.role);
    });
    
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({ email: 'test@example.com' }) // Missing password
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Email and password are required');
    });
    
    it('should return 409 if user already exists', async () => {
      // Create a user first
      const user = await createTestUser();
      
      const response = await request(app)
        .post('/api/register')
        .send({
          email: user.email,
          password: 'testpassword123'
        })
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(409);
      
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('User already exists');
    });
  });
  
  describe('POST /api/login', () => {
    it('should login an existing user', async () => {
      // Create a test user
      const user = await createTestUser();
      
      const response = await request(app)
        .post('/api/login')
        .send({
          email: user.email,
          password: 'password123' // This matches the password set in createTestUser
        })
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Login successful');
      expect(response.body.user).to.exist;
      expect(response.body.user.email).to.equal(user.email);
    });
    
    it('should return 401 if user does not exist', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'testpassword123'
        })
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('User is not registered');
    });
    
    it('should return 401 if password is incorrect', async () => {
      // Create a test user
      const user = await createTestUser();
      
      const response = await request(app)
        .post('/api/login')
        .send({
          email: user.email,
          password: 'wrongpassword'
        })
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Invalid credentials');
    });
    
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com' }) // Missing password
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Email and password are required');
    });
  });
}); 