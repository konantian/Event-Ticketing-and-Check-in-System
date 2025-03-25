const request = require('supertest');
const { createServer } = require('http');
const { apiResolver } = require('next/dist/server/api-utils/node');
const { createTestUser, createTestDiscount, prisma } = require('../testUtils');
const { cleanupDatabase } = require('../setup');
const discountsHandler = require('../../app/api/discounts/route');
const discountByIdHandler = require('../../app/api/discounts/[id]/route');

describe('Discounts API', () => {
  // Clean up database after each test
  afterEach(async () => {
    await cleanupDatabase();
  });

  describe('GET /api/discounts', () => {
    it('should return all discount codes for organizer role', async () => {
      // Create test discount codes
      const discount1 = await createTestDiscount('TEST1');
      const discount2 = await createTestDiscount('TEST2');
      const organizer = await createTestUser('Organizer');
      
      const server = createServer((req, res) => {
        // Manually attach user for test
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: organizer.id,
          email: organizer.email,
          role: organizer.role
        });
        
        return apiResolver(req, res, undefined, discountsHandler, {}, false);
      });
      
      const response = await request(server)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.discounts).toBeDefined();
      expect(Array.isArray(response.body.discounts)).toBe(true);
      expect(response.body.discounts.length).toBeGreaterThanOrEqual(2);
      
      // Verify the discount codes
      const discountCodes = response.body.discounts.map(d => d.code);
      expect(discountCodes).toContain('TEST1');
      expect(discountCodes).toContain('TEST2');
      
      server.close();
    });
    
    it('should return 401 if user is not authenticated', async () => {
      await createTestDiscount('TEST1');
      
      const server = createServer((req, res) => {
        return apiResolver(req, res, undefined, discountsHandler, {}, false);
      });
      
      const response = await request(server)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      
      server.close();
    });
    
    it('should return 403 if user is not an organizer', async () => {
      await createTestDiscount('TEST1');
      const attendee = await createTestUser('Attendee');
      
      const server = createServer((req, res) => {
        // Manually attach user for test
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: attendee.id,
          email: attendee.email,
          role: attendee.role
        });
        
        return apiResolver(req, res, undefined, discountsHandler, {}, false);
      });
      
      const response = await request(server)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      
      server.close();
    });
  });
  
  describe('POST /api/discounts', () => {
    it('should create a new discount code for organizer role', async () => {
      const organizer = await createTestUser('Organizer');
      
      const server = createServer((req, res) => {
        // Manually attach user for test
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: organizer.id,
          email: organizer.email,
          role: organizer.role
        });
        
        return apiResolver(req, res, undefined, discountsHandler, {}, false);
      });
      
      const discountData = {
        code: 'NEWCODE',
        type: 'Percentage',
        value: 15
      };
      
      const response = await request(server)
        .post('/')
        .send(discountData)
        .expect('Content-Type', /json/)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Discount code created successfully');
      expect(response.body.discount).toBeDefined();
      expect(response.body.discount.code).toBe(discountData.code);
      expect(response.body.discount.type).toBe(discountData.type);
      expect(response.body.discount.value).toBe(discountData.value);
      
      // Verify discount code in database
      const createdDiscount = await prisma.discount.findUnique({
        where: { code: discountData.code }
      });
      
      expect(createdDiscount).not.toBeNull();
      expect(createdDiscount.code).toBe(discountData.code);
      expect(createdDiscount.type).toBe(discountData.type);
      expect(createdDiscount.value).toBe(discountData.value);
      
      server.close();
    });
    
    it('should return 401 if user is not authenticated', async () => {
      const server = createServer((req, res) => {
        return apiResolver(req, res, undefined, discountsHandler, {}, false);
      });
      
      const discountData = {
        code: 'NEWCODE',
        type: 'Percentage',
        value: 15
      };
      
      const response = await request(server)
        .post('/')
        .send(discountData)
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      
      server.close();
    });
    
    it('should return 403 if user is not an organizer', async () => {
      const attendee = await createTestUser('Attendee');
      
      const server = createServer((req, res) => {
        // Manually attach user for test
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: attendee.id,
          email: attendee.email,
          role: attendee.role
        });
        
        return apiResolver(req, res, undefined, discountsHandler, {}, false);
      });
      
      const discountData = {
        code: 'NEWCODE',
        type: 'Percentage',
        value: 15
      };
      
      const response = await request(server)
        .post('/')
        .send(discountData)
        .expect('Content-Type', /json/)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      
      server.close();
    });
    
    it('should return 400 if discount code already exists', async () => {
      const organizer = await createTestUser('Organizer');
      await createTestDiscount('EXISTINGCODE');
      
      const server = createServer((req, res) => {
        // Manually attach user for test
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: organizer.id,
          email: organizer.email,
          role: organizer.role
        });
        
        return apiResolver(req, res, undefined, discountsHandler, {}, false);
      });
      
      const discountData = {
        code: 'EXISTINGCODE',
        type: 'Percentage',
        value: 15
      };
      
      const response = await request(server)
        .post('/')
        .send(discountData)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Discount code already exists');
      
      server.close();
    });
  });
  
  describe('GET /api/discounts/[id]', () => {
    it('should return a specific discount by ID for organizer', async () => {
      const organizer = await createTestUser('Organizer');
      const discount = await createTestDiscount();
      
      const server = createServer((req, res) => {
        // Manually attach user for test
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: organizer.id,
          email: organizer.email,
          role: organizer.role
        });
        
        return apiResolver(
          req, 
          res, 
          { id: discount.id.toString() }, 
          discountByIdHandler, 
          {}, 
          false
        );
      });
      
      const response = await request(server)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.discount).toBeDefined();
      expect(response.body.discount.id).toBe(discount.id);
      expect(response.body.discount.code).toBe(discount.code);
      
      server.close();
    });
    
    it('should return 401 if user is not authenticated', async () => {
      const discount = await createTestDiscount();
      
      const server = createServer((req, res) => {
        return apiResolver(
          req, 
          res, 
          { id: discount.id.toString() }, 
          discountByIdHandler, 
          {}, 
          false
        );
      });
      
      const response = await request(server)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      
      server.close();
    });
    
    it('should return 403 if user is not an organizer', async () => {
      const attendee = await createTestUser('Attendee');
      const discount = await createTestDiscount();
      
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
          { id: discount.id.toString() }, 
          discountByIdHandler, 
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
    
    it('should return 404 if discount does not exist', async () => {
      const organizer = await createTestUser('Organizer');
      
      const server = createServer((req, res) => {
        // Manually attach user for test
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: organizer.id,
          email: organizer.email,
          role: organizer.role
        });
        
        return apiResolver(
          req, 
          res, 
          { id: '9999' }, // Non-existent ID
          discountByIdHandler, 
          {}, 
          false
        );
      });
      
      const response = await request(server)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Discount code not found');
      
      server.close();
    });
  });
  
  describe('DELETE /api/discounts/[id]', () => {
    it('should delete a discount code for organizer role', async () => {
      const organizer = await createTestUser('Organizer');
      const discount = await createTestDiscount();
      
      const server = createServer((req, res) => {
        // Manually attach user for test
        req.headers['x-test-auth-user'] = JSON.stringify({
          id: organizer.id,
          email: organizer.email,
          role: organizer.role
        });
        
        return apiResolver(
          req, 
          res, 
          { id: discount.id.toString() }, 
          discountByIdHandler, 
          {}, 
          false
        );
      });
      
      const response = await request(server)
        .delete('/')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Discount code deleted successfully');
      
      // Verify deletion in database
      const deletedDiscount = await prisma.discount.findUnique({
        where: { id: discount.id }
      });
      
      expect(deletedDiscount).toBeNull();
      
      server.close();
    });
    
    it('should return 401 if user is not authenticated', async () => {
      const discount = await createTestDiscount();
      
      const server = createServer((req, res) => {
        return apiResolver(
          req, 
          res, 
          { id: discount.id.toString() }, 
          discountByIdHandler, 
          {}, 
          false
        );
      });
      
      const response = await request(server)
        .delete('/')
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      
      server.close();
    });
    
    it('should return 403 if user is not an organizer', async () => {
      const attendee = await createTestUser('Attendee');
      const discount = await createTestDiscount();
      
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
          { id: discount.id.toString() }, 
          discountByIdHandler, 
          {}, 
          false
        );
      });
      
      const response = await request(server)
        .delete('/')
        .expect('Content-Type', /json/)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      
      server.close();
    });
  });
}); 