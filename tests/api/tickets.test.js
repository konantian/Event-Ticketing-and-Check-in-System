const request = require("supertest");
const serverUrl = "http://localhost:3000";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

describe("Tickets API", () => {
  let organizer;
  let attendee;
  let organizerToken;
  let attendeeToken;
  let testEvent;
  let testDiscount;

  const sampleEvent = {
    name: "Test Event",
    description: "A test event description",
    capacity: 100,
    remaining: 100, // Initialize remaining to match capacity
    location: "Test Location",
    startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 172800000).toISOString() // Day after tomorrow
  };

  beforeAll(async () => {
    // Clean up database
    await prisma.ticket.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
    await prisma.discount.deleteMany();

    // Create test users
    organizer = await prisma.user.create({
      data: {
        email: "organizer@test.com",
        password: "hashedpassword",
        role: "Organizer"
      }
    });

    attendee = await prisma.user.create({
      data: {
        email: "attendee@test.com",
        password: "hashedpassword",
        role: "Attendee"
      }
    });

    // Generate tokens
    organizerToken = jwt.sign(
      { userId: organizer.id.toString(), email: organizer.email, role: organizer.role },
      process.env.JWT_SECRET || "your-secret-key"
    );

    attendeeToken = jwt.sign(
      { userId: attendee.id.toString(), email: attendee.email, role: attendee.role },
      process.env.JWT_SECRET || "your-secret-key"
    );

    // Create a test event
    testEvent = await prisma.event.create({
      data: {
        ...sampleEvent,
        organizerId: organizer.id
      }
    });

    // Create a test discount
    testDiscount = await prisma.discount.create({
      data: {
        code: "TEST50",
        type: "Percentage",
        value: 50,
        timesUsed: 0
      }
    });
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
    await prisma.discount.deleteMany();
    await prisma.$disconnect();
  });

  describe("GET /api/tickets", () => {
    beforeEach(async () => {
      await prisma.ticket.deleteMany();
    });

    it("should return user's tickets when authenticated", async () => {
      // Create a test ticket
      const ticket = await prisma.ticket.create({
        data: {
          eventId: testEvent.id,
          userId: attendee.id,
          tier: "General",
          price: 50.0,
          qrCodeData: "test-qr-data"
        }
      });

      const res = await request(serverUrl)
        .get("/api/tickets")
        .set("Authorization", `Bearer ${attendeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.tickets)).toBe(true);
      expect(res.body.tickets.length).toBe(1);
      expect(res.body.tickets[0].id).toBe(ticket.id);
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(serverUrl)
        .get("/api/tickets");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized");
    });

    it("should return empty array when user has no tickets", async () => {
      const res = await request(serverUrl)
        .get("/api/tickets")
        .set("Authorization", `Bearer ${attendeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.tickets)).toBe(true);
      expect(res.body.tickets.length).toBe(0);
    });
  });

  describe("POST /api/tickets", () => {
    beforeEach(async () => {
      await prisma.ticket.deleteMany();
    });

    it("should create a new ticket when authenticated", async () => {
      const ticketData = {
        eventId: testEvent.id,
        tier: "General"
      };

      const res = await request(serverUrl)
        .post("/api/tickets")
        .set("Authorization", `Bearer ${attendeeToken}`)
        .send(ticketData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket.eventId).toBe(testEvent.id);
      expect(res.body.ticket.userId).toBe(attendee.id);
      expect(res.body.ticket.tier).toBe("General");
      expect(typeof res.body.ticket.qrCodeData).toBe("string");
    });

    it("should apply discount when valid discount code is provided", async () => {
      const ticketData = {
        eventId: testEvent.id,
        tier: "General",
        discountCode: "VWO50"
      };

      const res = await request(serverUrl)
        .post("/api/tickets")
        .set("Authorization", `Bearer ${attendeeToken}`)
        .send(ticketData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket.price).toBe(50);
    });

    it("should return 401 when no token is provided", async () => {
      const ticketData = {
        eventId: testEvent.id,
        tier: "General"
      };

      const res = await request(serverUrl)
        .post("/api/tickets")
        .send(ticketData);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized");
    });

    it("should return 400 when event ID is missing", async () => {
      const ticketData = {
        tier: "General"
      };

      const res = await request(serverUrl)
        .post("/api/tickets")
        .set("Authorization", `Bearer ${attendeeToken}`)
        .send(ticketData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Event ID is required");
    });

    it("should return 404 when event does not exist", async () => {
      const ticketData = {
        eventId: 999999,
        tier: "General"
      };

      const res = await request(serverUrl)
        .post("/api/tickets")
        .set("Authorization", `Bearer ${attendeeToken}`)
        .send(ticketData);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Event not found");
    });

    it("should return 400 when event is sold out", async () => {
      // Create a sold out event
      const soldOutEvent = await prisma.event.create({
        data: {
          ...sampleEvent,
          organizerId: organizer.id,
          capacity: 1,
          remaining: 0 // Set remaining to 0 to simulate sold out
        }
      });

      const ticketData = {
        eventId: soldOutEvent.id,
        tier: "General"
      };

      const res = await request(serverUrl)
        .post("/api/tickets")
        .set("Authorization", `Bearer ${attendeeToken}`)
        .send(ticketData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Event is sold out");
    });

    it("should decrement remaining tickets when purchasing a ticket", async () => {
      // Create an event with 5 remaining tickets
      const event = await prisma.event.create({
        data: {
          ...sampleEvent,
          organizerId: organizer.id,
          capacity: 5,
          remaining: 5
        }
      });

      const ticketData = {
        eventId: event.id,
        tier: "General"
      };

      const res = await request(serverUrl)
        .post("/api/tickets")
        .set("Authorization", `Bearer ${attendeeToken}`)
        .send(ticketData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Verify remaining count was decremented
      const updatedEvent = await prisma.event.findUnique({
        where: { id: event.id }
      });
      expect(updatedEvent.remaining).toBe(4);
    });
  });

  describe("GET /api/tickets/[id]", () => {
    let testTicket;

    beforeEach(async () => {
      await prisma.ticket.deleteMany();
      testTicket = await prisma.ticket.create({
        data: {
          eventId: testEvent.id,
          userId: attendee.id,
          tier: "General",
          price: 50.0,
          qrCodeData: "test-qr-data"
        }
      });
    });

    it("should return ticket details when ticket owner is authenticated", async () => {
      const res = await request(serverUrl)
        .get(`/api/tickets/${testTicket.id}`)
        .set("Authorization", `Bearer ${attendeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket.id).toBe(testTicket.id);
      expect(res.body.ticket.userId).toBe(attendee.id);
    });

    it("should return ticket details when organizer is authenticated", async () => {
      const res = await request(serverUrl)
        .get(`/api/tickets/${testTicket.id}`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket.id).toBe(testTicket.id);
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(serverUrl)
        .get(`/api/tickets/${testTicket.id}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized");
    });

    it("should return 403 when non-owner/non-organizer tries to access ticket", async () => {
      // Create another attendee
      const anotherAttendee = await prisma.user.create({
        data: {
          email: "another@test.com",
          password: "hashedpassword",
          role: "Attendee"
        }
      });

      const anotherToken = jwt.sign(
        { userId: anotherAttendee.id.toString(), email: anotherAttendee.email, role: anotherAttendee.role },
        process.env.JWT_SECRET || "your-secret-key"
      );

      const res = await request(serverUrl)
        .get(`/api/tickets/${testTicket.id}`)
        .set("Authorization", `Bearer ${anotherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized to view this ticket");
    });

    it("should return 404 for non-existent ticket", async () => {
      const res = await request(serverUrl)
        .get("/api/tickets/999999")
        .set("Authorization", `Bearer ${attendeeToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Ticket not found");
    });
  });
}); 