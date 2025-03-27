const request = require('supertest');
const { expect } = require('chai');
const { cleanupDatabase } = require('../setup');
const { createTestUser } = require('../testUtils');
const { createTestServer } = require('../testServer');

describe('Discounts API', () => {
  let app;

  before(() => {
    app = createTestServer();
  });

  afterEach(async () => {
    await cleanupDatabase();
  });

  describe('GET /api/discounts', () => {
    it('should return all discount codes for organizer role', async () => {
      const organizer = await createTestUser({ role: 'Organizer' });

      const response = await request(app)
        .get('/api/discounts')
        .set('x-test-auth-user', JSON.stringify({
          id: organizer.id,
          email: organizer.email,
          role: organizer.role
        }))
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.discounts).to.be.an('array');
    });

    it('should return 401 if user is not authorized', async () => {
      const attendee = await createTestUser({ role: 'Attendee' });

      const response = await request(app)
        .get('/api/discounts')
        .set('x-test-auth-user', JSON.stringify({
          id: attendee.id,
          email: attendee.email,
          role: attendee.role
        }))
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Unauthorized');
    });
  });

  describe('POST /api/discounts', () => {
    it('should create a new discount code for organizer role', async () => {
      const organizer = await createTestUser({ role: 'Organizer' });

      const response = await request(app)
        .post('/api/discounts')
        .set('x-test-auth-user', JSON.stringify({
          id: organizer.id,
          email: organizer.email,
          role: organizer.role
        }))
        .send({
          code: 'TESTCODE',
          type: 'Percentage',
          value: 10
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).to.be.true;
      expect(response.body.discount).to.exist;
      expect(response.body.discount.code).to.equal('TESTCODE');
      expect(response.body.discount.type).to.equal('Percentage');
      expect(response.body.discount.value).to.equal(10);
      expect(response.body.discount.timesUsed).to.equal(0);
    });

    it('should return 401 if user is not authorized', async () => {
      const attendee = await createTestUser({ role: 'Attendee' });

      const response = await request(app)
        .post('/api/discounts')
        .set('x-test-auth-user', JSON.stringify({
          id: attendee.id,
          email: attendee.email,
          role: attendee.role
        }))
        .send({
          code: 'TESTCODE',
          type: 'Percentage',
          value: 10
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Unauthorized');
    });

    it('should return 400 if discount code already exists', async () => {
      const organizer = await createTestUser({ role: 'Organizer' });

      // Create first discount code
      await request(app)
        .post('/api/discounts')
        .set('x-test-auth-user', JSON.stringify({
          id: organizer.id,
          email: organizer.email,
          role: organizer.role
        }))
        .send({
          code: 'TESTCODE',
          type: 'Percentage',
          value: 10
        });

      // Try to create the same code again
      const response = await request(app)
        .post('/api/discounts')
        .set('x-test-auth-user', JSON.stringify({
          id: organizer.id,
          email: organizer.email,
          role: organizer.role
        }))
        .send({
          code: 'TESTCODE',
          type: 'Percentage',
          value: 15
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Discount code already exists');
    });
  });
}); 