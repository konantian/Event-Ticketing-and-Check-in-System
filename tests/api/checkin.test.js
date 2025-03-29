const request = require("supertest");
const serverUrl = "http://localhost:3000";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

describe("Check-in API", () => {
  let organizer;
  let staff;
  let attendee;
  let organizerToken;
  let staffToken;
  let attendeeToken;
  let testEvent;
  let testTicket;

  const sampleEvent = {
    name: "Test Event",
    description: "A test event description",
    capacity: 100,
    location: "Test Location",
    startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 172800000).toISOString() // Day after tomorrow
  };

  beforeAll(async () => {
    // Clean up database
    await prisma.checkIn.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    organizer = await prisma.user.create({
      data: {
        email: "organizer@test.com",
        password: "hashedpassword",
        role: "Organizer"
      }
    });

    staff = await prisma.user.create({
      data: {
        email: "staff@test.com",
        password: "hashedpassword",
        role: "Staff"
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
      process.env.JWT_SECRET
    );

    staffToken = jwt.sign(
      { userId: staff.id.toString(), email: staff.email, role: staff.role },
      process.env.JWT_SECRET
    );

    attendeeToken = jwt.sign(
      { userId: attendee.id.toString(), email: attendee.email, role: attendee.role },
      process.env.JWT_SECRET
    );

    // Create a test event
    testEvent = await prisma.event.create({
      data: {
        ...sampleEvent,
        organizerId: organizer.id
      }
    });

    // Create a test ticket
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

  afterAll(async () => {
    await prisma.checkIn.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe("POST /api/checkin", () => {
    beforeEach(async () => {
      await prisma.checkIn.deleteMany();
    });

    it("should check in a ticket when staff is authenticated", async () => {
      const res = await request(serverUrl)
        .post("/api/checkin")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ qrCodeData: testTicket.qrCodeData });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Check-in successful");
      expect(res.body.checkIn.ticketId).toBe(testTicket.id);
      expect(res.body.checkIn.status).toBe("Checked In");
    });

    it("should check in a ticket when organizer is authenticated", async () => {
      const res = await request(serverUrl)
        .post("/api/checkin")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({ qrCodeData: testTicket.qrCodeData });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Check-in successful");
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(serverUrl)
        .post("/api/checkin")
        .send({ qrCodeData: testTicket.qrCodeData });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized");
    });

    it("should return 403 when attendee tries to check in", async () => {
      const res = await request(serverUrl)
        .post("/api/checkin")
        .set("Authorization", `Bearer ${attendeeToken}`)
        .send({ qrCodeData: testTicket.qrCodeData });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Forbidden");
    });

    it("should return 400 when QR code data is missing", async () => {
      const res = await request(serverUrl)
        .post("/api/checkin")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("QR code data is required");
    });

    it("should return 404 for invalid QR code", async () => {
      const res = await request(serverUrl)
        .post("/api/checkin")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ qrCodeData: "invalid-qr-code" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid QR code");
    });

    it("should return 400 when ticket is already checked in", async () => {
      // First check-in
      await request(serverUrl)
        .post("/api/checkin")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ qrCodeData: testTicket.qrCodeData });

      // Try to check in again
      const res = await request(serverUrl)
        .post("/api/checkin")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ qrCodeData: testTicket.qrCodeData });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Ticket already checked in");
    });
  });

  describe("GET /api/checkin/status", () => {
    beforeEach(async () => {
      await prisma.checkIn.deleteMany();
    });

    it("should return check-in status when staff is authenticated", async () => {
      // Create a check-in
      await prisma.checkIn.create({
        data: {
          ticketId: testTicket.id,
          status: "Checked In"
        }
      });

      const res = await request(serverUrl)
        .get(`/api/checkin/status?eventId=${testEvent.id}`)
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats.totalTickets).toBe(1);
      expect(res.body.stats.checkedInTickets).toBe(1);
      expect(res.body.stats.checkedInPercentage).toBe(100);
      expect(Array.isArray(res.body.checkedInAttendees)).toBe(true);
      expect(res.body.checkedInAttendees.length).toBe(1);
    });

    it("should return check-in status when organizer is authenticated", async () => {
      const res = await request(serverUrl)
        .get(`/api/checkin/status?eventId=${testEvent.id}`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(serverUrl)
        .get(`/api/checkin/status?eventId=${testEvent.id}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized");
    });

    it("should return 403 when attendee tries to access status", async () => {
      const res = await request(serverUrl)
        .get(`/api/checkin/status?eventId=${testEvent.id}`)
        .set("Authorization", `Bearer ${attendeeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Forbidden");
    });

    it("should return 400 when event ID is missing", async () => {
      const res = await request(serverUrl)
        .get("/api/checkin/status")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Valid event ID is required");
    });

    it("should return 404 for non-existent event", async () => {
      const res = await request(serverUrl)
        .get("/api/checkin/status?eventId=999999")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Event not found");
    });
  });
}); 