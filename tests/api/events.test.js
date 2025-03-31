const request = require("supertest");
const serverUrl = "http://localhost:3000";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

describe("Events API", () => {
  let organizer;
  let attendee;
  let organizerToken;
  let attendeeToken;

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

    attendeeToken = jwt.sign(
      { userId: attendee.id.toString(), email: attendee.email, role: attendee.role },
      process.env.JWT_SECRET
    );
  });

  afterAll(async () => {
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe("GET /api/events", () => {
    beforeEach(async () => {
      await prisma.event.deleteMany();
    });

    it("should return all events", async () => {
      // Create a test event
      await prisma.event.create({
        data: {
          ...sampleEvent,
          organizerId: organizer.id
        }
      });

      const res = await request(serverUrl)
        .get("/api/events");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.events)).toBe(true);
      expect(res.body.events.length).toBe(1);
      expect(res.body.events[0].name).toBe(sampleEvent.name);
    });

    it("should return empty array when no events exist", async () => {
      const res = await request(serverUrl)
        .get("/api/events");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.events)).toBe(true);
      expect(res.body.events.length).toBe(0);
    });
  });

  describe("POST /api/events", () => {
    beforeEach(async () => {
      await prisma.event.deleteMany();
    });

    it("should create a new event when organizer is authenticated", async () => {
      const res = await request(serverUrl)
        .post("/api/events")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send(sampleEvent);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Event created successfully");
      expect(res.body.event.name).toBe(sampleEvent.name);
      expect(res.body.event.organizerId).toBe(organizer.id);
      expect(res.body.event.remaining).toBe(sampleEvent.capacity);
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(serverUrl)
        .post("/api/events")
        .send(sampleEvent);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized");
    });

    it("should return 403 when non-organizer tries to create event", async () => {
      const res = await request(serverUrl)
        .post("/api/events")
        .set("Authorization", `Bearer ${attendeeToken}`)
        .send(sampleEvent);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Forbidden");
    });

    it("should return 400 when required fields are missing", async () => {
      const invalidEvent = {
        name: "Test Event",
        // missing other required fields
      };

      const res = await request(serverUrl)
        .post("/api/events")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send(invalidEvent);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("All fields are required");
    });
  });

  describe("GET /api/events/[id]", () => {
    let testEvent;

    beforeEach(async () => {
      await prisma.event.deleteMany();
      testEvent = await prisma.event.create({
        data: {
          ...sampleEvent,
          organizerId: organizer.id
        }
      });
    });

    it("should return event details for valid ID", async () => {
      const res = await request(serverUrl)
        .get(`/api/events/${testEvent.id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.event.id).toBe(testEvent.id);
      expect(res.body.event.name).toBe(testEvent.name);
    });

    it("should return 404 for non-existent event", async () => {
      const res = await request(serverUrl)
        .get("/api/events/999999");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Event not found");
    });

    it("should return 400 for invalid event ID", async () => {
      const res = await request(serverUrl)
        .get("/api/events/invalid-id");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid event ID");
    });
  });

  describe("PUT /api/events/[id]", () => {
    let testEvent;

    beforeEach(async () => {
      await prisma.event.deleteMany();
      testEvent = await prisma.event.create({
        data: {
          ...sampleEvent,
          organizerId: organizer.id
        }
      });
    });

    it("should update event when organizer is authenticated", async () => {
      const updateData = {
        name: "Updated Event Name",
        description: "Updated description"
      };

      const res = await request(serverUrl)
        .put(`/api/events/${testEvent.id}`)
        .set("Authorization", `Bearer ${organizerToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Event updated successfully");
      expect(res.body.event.name).toBe(updateData.name);
      expect(res.body.event.description).toBe(updateData.description);
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(serverUrl)
        .put(`/api/events/${testEvent.id}`)
        .send({ name: "Updated Name" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized");
    });

    it("should return 403 when non-organizer tries to update event", async () => {
      const res = await request(serverUrl)
        .put(`/api/events/${testEvent.id}`)
        .set("Authorization", `Bearer ${attendeeToken}`)
        .send({ name: "Updated Name" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Forbidden");
    });

    it("should return 404 for non-existent event", async () => {
      const res = await request(serverUrl)
        .put("/api/events/999999")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({ name: "Updated Name" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Event not found");
    });
  });

  describe("DELETE /api/events/[id]", () => {
    let testEvent;

    beforeEach(async () => {
      await prisma.event.deleteMany();
      testEvent = await prisma.event.create({
        data: {
          ...sampleEvent,
          organizerId: organizer.id
        }
      });
    });

    it("should delete event when organizer is authenticated", async () => {
      const res = await request(serverUrl)
        .delete(`/api/events/${testEvent.id}`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Event deleted successfully");

      // Verify event is deleted
      const deletedEvent = await prisma.event.findUnique({
        where: { id: testEvent.id }
      });
      expect(deletedEvent).toBeNull();
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(serverUrl)
        .delete(`/api/events/${testEvent.id}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized");
    });

    it("should return 403 when non-organizer tries to delete event", async () => {
      const res = await request(serverUrl)
        .delete(`/api/events/${testEvent.id}`)
        .set("Authorization", `Bearer ${attendeeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Forbidden");
    });

    it("should return 404 for non-existent event", async () => {
      const res = await request(serverUrl)
        .delete("/api/events/999999")
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Event not found");
    });
  });
}); 