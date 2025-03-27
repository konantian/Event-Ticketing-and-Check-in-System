const express = require('express');
const bodyParser = require('body-parser');
const { prisma } = require('./testUtils');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

function createTestServer() {
  const app = express();
  app.use(bodyParser.json());

  // Authentication routes
  app.post('/api/register', async (req, res) => {
    try {
      const { email, password, role = 'Attendee' } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email and password are required' 
        });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          message: 'User already exists' 
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, role }
      });

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: { id: user.id, email: user.email, role: user.role },
        token
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email and password are required' 
        });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        user: { id: user.id, email: user.email, role: user.role },
        token
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Events routes
  app.get('/api/events', async (req, res) => {
    try {
      const events = await prisma.event.findMany();
      res.json({ success: true, events });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    try {
      const event = await prisma.event.findUnique({
        where: { id: parseInt(req.params.id) }
      });

      if (!event) {
        return res.status(404).json({ 
          success: false, 
          message: 'Event not found' 
        });
      }

      res.json({ success: true, event });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.post('/api/events', async (req, res) => {
    try {
      const user = JSON.parse(req.headers['x-test-auth-user'] || '{}');
      if (!user || !['Organizer'].includes(user.role)) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }

      const { name, description, capacity, location, startTime, endTime } = req.body;
      if (!name || !capacity || !location || !startTime || !endTime) {
        return res.status(400).json({ 
          success: false, 
          message: 'Required fields missing' 
        });
      }

      // Check if organizer exists
      const organizer = await prisma.user.findUnique({
        where: { id: user.id }
      });

      if (!organizer) {
        return res.status(404).json({ 
          success: false, 
          message: 'Organizer not found' 
        });
      }

      const event = await prisma.event.create({
        data: {
          organizerId: user.id,
          name,
          description,
          capacity: parseInt(capacity),
          location,
          startTime: new Date(startTime),
          endTime: new Date(endTime)
        }
      });

      res.status(201).json({ success: true, event });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.put('/api/events/:id', async (req, res) => {
    try {
      const user = JSON.parse(req.headers['x-test-auth-user'] || '{}');
      if (!user || !['Organizer'].includes(user.role)) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }

      const event = await prisma.event.findUnique({
        where: { id: parseInt(req.params.id) }
      });

      if (!event) {
        return res.status(404).json({ 
          success: false, 
          message: 'Event not found' 
        });
      }

      if (event.organizerId !== user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Forbidden' 
        });
      }

      const { name, description, capacity, location, startTime, endTime } = req.body;
      const updatedEvent = await prisma.event.update({
        where: { id: parseInt(req.params.id) },
        data: {
          name,
          description,
          capacity: parseInt(capacity),
          location,
          startTime: new Date(startTime),
          endTime: new Date(endTime)
        }
      });

      res.json({ success: true, event: updatedEvent });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.delete('/api/events/:id', async (req, res) => {
    try {
      const user = JSON.parse(req.headers['x-test-auth-user'] || '{}');
      if (!user || !['Organizer'].includes(user.role)) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }

      const event = await prisma.event.findUnique({
        where: { id: parseInt(req.params.id) }
      });

      if (!event) {
        return res.status(404).json({ 
          success: false, 
          message: 'Event not found' 
        });
      }

      if (event.organizerId !== user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Forbidden' 
        });
      }

      await prisma.event.delete({
        where: { id: parseInt(req.params.id) }
      });

      res.json({ 
        success: true, 
        message: 'Event deleted successfully' 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Tickets routes
  app.get('/api/tickets', async (req, res) => {
    try {
      const user = JSON.parse(req.headers['x-test-auth-user'] || '{}');
      if (!user || !['Staff', 'Organizer'].includes(user.role)) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }

      const tickets = await prisma.ticket.findMany();
      res.json({ success: true, tickets });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.post('/api/tickets', async (req, res) => {
    try {
      let user;
      try {
        user = JSON.parse(req.headers['x-test-auth-user'] || '{}');
      } catch (error) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }

      if (!user || !user.id) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }

      const { eventId, price, tier } = req.body;
      if (!eventId || !price || !tier) {
        return res.status(400).json({ 
          success: false, 
          message: 'Required fields missing' 
        });
      }

      const ticket = await prisma.ticket.create({
        data: {
          userId: user.id,
          eventId: parseInt(eventId),
          price: parseFloat(price),
          tier,
          qrCodeData: `ticket-${Date.now()}`
        }
      });

      res.status(201).json({ success: true, ticket });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Check-in routes
  app.post('/api/checkin', async (req, res) => {
    try {
      const user = JSON.parse(req.headers['x-test-auth-user'] || '{}');
      if (!user || !['Staff', 'Organizer'].includes(user.role)) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }

      const { ticketId } = req.body;
      const ticket = await prisma.ticket.findUnique({
        where: { id: parseInt(ticketId) },
        include: { checkIn: true }
      });

      if (!ticket) {
        return res.status(404).json({ 
          success: false, 
          message: 'Ticket not found' 
        });
      }

      if (ticket.checkIn) {
        return res.status(400).json({ 
          success: false, 
          message: 'Ticket already checked in' 
        });
      }

      const checkIn = await prisma.checkIn.create({
        data: {
          ticketId: parseInt(ticketId),
          status: 'Checked In',
          timestamp: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Ticket checked in successfully',
        checkIn
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.get('/api/checkin/status/:ticketId', async (req, res) => {
    try {
      const user = JSON.parse(req.headers['x-test-auth-user'] || '{}');
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }

      const { ticketId } = req.params;
      const ticket = await prisma.ticket.findUnique({
        where: { id: parseInt(ticketId) }
      });

      if (!ticket) {
        return res.status(404).json({ 
          success: false, 
          message: 'Ticket not found' 
        });
      }

      if (!['Staff', 'Organizer'].includes(user.role) && ticket.userId !== user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Forbidden' 
        });
      }

      const checkIn = await prisma.checkIn.findUnique({
        where: { ticketId: parseInt(ticketId) }
      });

      if (!checkIn) {
        return res.json({
          success: true,
          status: 'Not Checked In'
        });
      }

      res.json({
        success: true,
        checkIn
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Discounts routes
  app.get('/api/discounts', async (req, res) => {
    try {
      const user = JSON.parse(req.headers['x-test-auth-user'] || '{}');
      if (!user || !['Staff', 'Organizer'].includes(user.role)) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }

      const discounts = await prisma.discount.findMany();
      res.json({ success: true, discounts });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.post('/api/discounts', async (req, res) => {
    try {
      const user = JSON.parse(req.headers['x-test-auth-user'] || '{}');
      if (!user || !['Organizer'].includes(user.role)) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }

      const { code, type, value } = req.body;
      if (!code || !type || !value) {
        return res.status(400).json({ 
          success: false, 
          message: 'Required fields missing' 
        });
      }

      const existingDiscount = await prisma.discount.findFirst({
        where: { code }
      });

      if (existingDiscount) {
        return res.status(400).json({ 
          success: false, 
          message: 'Discount code already exists' 
        });
      }

      const discount = await prisma.discount.create({
        data: {
          code,
          type,
          value: parseFloat(value),
          timesUsed: 0
        }
      });

      res.status(201).json({ success: true, discount });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  return app;
}

module.exports = { createTestServer }; 