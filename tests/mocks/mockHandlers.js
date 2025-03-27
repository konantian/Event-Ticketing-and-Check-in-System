const bcrypt = require('bcrypt');
const { prisma } = require('../testUtils');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
const JWT_EXPIRES_IN = '20m';

// Mock handlers for the API routes

// Auth Handlers
const authHandlers = {
  // Register
  async register(req, res) {
    try {
      const { email, password, role = 'Attendee' } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
        },
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id.toString(), email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User is not registered'
        });
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id.toString(), email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

// Event Handlers
const eventHandlers = {
  // Get all events
  async getEvents(req, res) {
    try {
      const events = await prisma.event.findMany({
        include: {
          organizer: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        }
      });

      return res.status(200).json({
        success: true,
        events
      });
    } catch (error) {
      console.error('Error getting events:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving events'
      });
    }
  },

  // Create an event
  async createEvent(req, res) {
    try {
      const { 
        name, 
        description, 
        startTime,
        endTime,
        location, 
        capacity, 
        organizerId 
      } = req.body;

      // Validate required fields
      if (!name || !startTime || !organizerId) {
        return res.status(400).json({
          success: false,
          message: 'Name, date, and organizerId are required'
        });
      }

      // Check if organizer exists
      const organizer = await prisma.user.findUnique({
        where: { id: organizerId }
      });

      if (!organizer) {
        return res.status(404).json({
          success: false,
          message: 'Organizer not found'
        });
      }

      // Create event
      const event = await prisma.event.create({
        data: {
          name,
          description,
          startTime: new Date(startTime),
          endTime: endTime ? new Date(endTime) : null,
          location,
          capacity: capacity ? parseInt(capacity) : null,
          organizerId
        },
        include: {
          organizer: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Event created successfully',
        event
      });
    } catch (error) {
      console.error('Error creating event:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating event'
      });
    }
  },

  // Get event by ID
  async getEvent(req, res) {
    try {
      const { id } = req.params;

      const event = await prisma.event.findUnique({
        where: { id: parseInt(id) },
        include: {
          organizer: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        }
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      return res.status(200).json({
        success: true,
        event
      });
    } catch (error) {
      console.error('Error getting event:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving event'
      });
    }
  },

  // Update event
  async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const { 
        name, 
        description, 
        startTime,
        endTime,
        location, 
        capacity 
      } = req.body;

      // Check if event exists
      const existingEvent = await prisma.event.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingEvent) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      // Update event
      const updatedEvent = await prisma.event.update({
        where: { id: parseInt(id) },
        data: {
          name,
          description,
          startTime: startTime ? new Date(startTime) : undefined,
          endTime: endTime ? new Date(endTime) : undefined,
          location,
          capacity: capacity ? parseInt(capacity) : undefined
        },
        include: {
          organizer: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Event updated successfully',
        event: updatedEvent
      });
    } catch (error) {
      console.error('Error updating event:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating event'
      });
    }
  },

  // Delete event
  async deleteEvent(req, res) {
    try {
      const { id } = req.params;

      // Check if event exists
      const existingEvent = await prisma.event.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingEvent) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      // Delete event
      await prisma.event.delete({
        where: { id: parseInt(id) }
      });

      return res.status(200).json({
        success: true,
        message: 'Event deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting event'
      });
    }
  }
};

// Ticket handlers
const ticketHandlers = {
  // Get all tickets
  async getTickets(req, res) {
    try {
      const tickets = await prisma.ticket.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true
            }
          },
          event: true,
          discount: true
        }
      });

      return res.status(200).json({
        success: true,
        tickets
      });
    } catch (error) {
      console.error('Error getting tickets:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving tickets'
      });
    }
  },

  // Create ticket
  async createTicket(req, res) {
    try {
      const { userId, eventId, price, tier = 'General', discountCodeId } = req.body;

      // Validate required fields
      if (!userId || !eventId || price === undefined) {
        return res.status(400).json({
          success: false,
          message: 'userId, eventId, and price are required'
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if event exists
      const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) }
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      // Generate QR code data
      const qrCodeData = `ticket-${userId}-${eventId}-${Date.now()}`;

      // Create ticket
      const ticketData = {
        userId: parseInt(userId),
        eventId: parseInt(eventId),
        price: parseFloat(price),
        tier,
        qrCodeData
      };

      // Add discount if provided
      if (discountCodeId) {
        ticketData.discountCodeId = parseInt(discountCodeId);
      }

      const ticket = await prisma.ticket.create({
        data: ticketData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true
            }
          },
          event: true,
          discount: true
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Ticket created successfully',
        ticket
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating ticket'
      });
    }
  },

  // Get ticket by ID
  async getTicket(req, res) {
    try {
      const { id } = req.params;

      const ticket = await prisma.ticket.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true
            }
          },
          event: true,
          discount: true,
          checkIn: true
        }
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }

      return res.status(200).json({
        success: true,
        ticket
      });
    } catch (error) {
      console.error('Error getting ticket:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving ticket'
      });
    }
  }
};

// Discount handlers
const discountHandlers = {
  // Get all discounts
  async getDiscounts(req, res) {
    try {
      const discounts = await prisma.discount.findMany();

      return res.status(200).json({
        success: true,
        discounts
      });
    } catch (error) {
      console.error('Error getting discounts:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving discounts'
      });
    }
  },

  // Create discount
  async createDiscount(req, res) {
    try {
      const { code, type, value } = req.body;

      // Validate required fields
      if (!code || !type || value === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Code, type, and value are required'
        });
      }

      // Check discount type
      if (type !== 'Percentage' && type !== 'Fixed Amount') {
        return res.status(400).json({
          success: false,
          message: 'Type must be either "Percentage" or "Fixed Amount"'
        });
      }

      // Check if discount code already exists
      const existingDiscount = await prisma.discount.findUnique({
        where: { code }
      });

      if (existingDiscount) {
        return res.status(409).json({
          success: false,
          message: 'Discount code already exists'
        });
      }

      // Create discount
      const discount = await prisma.discount.create({
        data: {
          code,
          type,
          value: parseFloat(value),
          timesUsed: 0
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Discount created successfully',
        discount
      });
    } catch (error) {
      console.error('Error creating discount:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating discount'
      });
    }
  },

  // Get discount by code
  async getDiscountByCode(req, res) {
    try {
      const { code } = req.params;

      const discount = await prisma.discount.findUnique({
        where: { code }
      });

      if (!discount) {
        return res.status(404).json({
          success: false,
          message: 'Discount not found'
        });
      }

      return res.status(200).json({
        success: true,
        discount
      });
    } catch (error) {
      console.error('Error getting discount:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving discount'
      });
    }
  }
};

// Check-in handlers
const checkInHandlers = {
  // Create check-in
  async createCheckIn(req, res) {
    try {
      const { ticketId, status = 'Checked In' } = req.body;

      // Validate required fields
      if (!ticketId) {
        return res.status(400).json({
          success: false,
          message: 'Ticket ID is required'
        });
      }

      // Check if ticket exists
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

      // Check if ticket is already checked in
      if (ticket.checkIn) {
        return res.status(409).json({
          success: false,
          message: 'Ticket already checked in'
        });
      }

      // Create check-in
      const checkIn = await prisma.checkIn.create({
        data: {
          ticketId: parseInt(ticketId),
          status
        },
        include: {
          ticket: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true
                }
              },
              event: true
            }
          }
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Check-in created successfully',
        checkIn
      });
    } catch (error) {
      console.error('Error creating check-in:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating check-in'
      });
    }
  },

  // Get check-in by ticket ID
  async getCheckInByTicketId(req, res) {
    try {
      const { ticketId } = req.params;

      const checkIn = await prisma.checkIn.findUnique({
        where: { ticketId: parseInt(ticketId) },
        include: {
          ticket: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true
                }
              },
              event: true
            }
          }
        }
      });

      if (!checkIn) {
        return res.status(404).json({
          success: false,
          message: 'Check-in not found'
        });
      }

      return res.status(200).json({
        success: true,
        checkIn
      });
    } catch (error) {
      console.error('Error getting check-in:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving check-in'
      });
    }
  }
};

module.exports = {
  authHandlers,
  eventHandlers,
  ticketHandlers,
  discountHandlers,
  checkInHandlers,
  prisma
}; 