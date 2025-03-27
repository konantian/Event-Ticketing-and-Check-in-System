const request = require('supertest');
const { expect } = require('chai');
const { cleanupDatabase } = require('../setup');
const { createTestUser } = require('../testUtils');
const { createTestServer } = require('../testServer');

describe('Authentication API', () => {
  let app;

  before(() => {
    app = createTestServer();
  });

  afterEach(async () => {
    await cleanupDatabase();
  });

  describe('POST /api/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          role: 'Attendee'
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('User registered successfully');
      expect(response.body.user).to.have.property('id');
      expect(response.body.user.email).to.equal('test@example.com');
      expect(response.body.user.role).to.equal('Attendee');
      expect(response.body.token).to.be.a('string');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          email: 'test@example.com'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Email and password are required');
    });

    it('should return 409 if user already exists', async () => {
      // Create a user first
      await createTestUser({
        email: 'existing@example.com',
        password: 'password123',
        role: 'Attendee'
      });

      // Try to register the same user
      const response = await request(app)
        .post('/api/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          role: 'Attendee'
        })
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('User already exists');
    });
  });

  describe('POST /api/login', () => {
    it('should login an existing user', async () => {
      // Create a user first
      await createTestUser({
        email: 'login@example.com',
        password: 'password123',
        role: 'Attendee'
      });

      // Try to login
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Login successful');
      expect(response.body.user).to.have.property('id');
      expect(response.body.user.email).to.equal('login@example.com');
      expect(response.body.user.role).to.equal('Attendee');
      expect(response.body.token).to.be.a('string');
    });

    it('should return 401 if user does not exist', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Invalid credentials');
    });

    it('should return 401 if password is incorrect', async () => {
      // Create a user first
      await createTestUser({
        email: 'wrongpass@example.com',
        password: 'password123',
        role: 'Attendee'
      });

      // Try to login with wrong password
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'wrongpass@example.com',
          password: 'wrongpassword'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Invalid credentials');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Email and password are required');
    });
  });
}); 