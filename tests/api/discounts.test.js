const request = require("supertest");
const serverUrl = "http://localhost:3000";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

describe("Discounts API", () => {
  let organizer;
  let attendee;
  let organizerToken;
  let attendeeToken;

  const sampleDiscount = {
    code: "TEST50",
    type: "Percentage",
    value: 50
  };

  beforeAll(async () => {
    // Clean up database
    await prisma.discount.deleteMany();
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
    await prisma.discount.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe("GET /api/discounts", () => {
    beforeEach(async () => {
      await prisma.discount.deleteMany();
    });

    it("should return all discounts when organizer is authenticated", async () => {
      // Create a test discount
      await prisma.discount.create({
        data: sampleDiscount
      });

      const res = await request(serverUrl)
        .get("/api/discounts")
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.discounts)).toBe(true);
      expect(res.body.discounts.length).toBe(1);
      expect(res.body.discounts[0].code).toBe(sampleDiscount.code);
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(serverUrl)
        .get("/api/discounts");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized");
    });

    it("should return 403 when non-organizer tries to access discounts", async () => {
      const res = await request(serverUrl)
        .get("/api/discounts")
        .set("Authorization", `Bearer ${attendeeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Forbidden");
    });

    it("should return empty array when no discounts exist", async () => {
      const res = await request(serverUrl)
        .get("/api/discounts")
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.discounts)).toBe(true);
      expect(res.body.discounts.length).toBe(0);
    });
  });

  describe("POST /api/discounts", () => {
    beforeEach(async () => {
      await prisma.discount.deleteMany();
    });

    it("should create a new discount when organizer is authenticated", async () => {
      const res = await request(serverUrl)
        .post("/api/discounts")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send(sampleDiscount);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Discount code created successfully");
      expect(res.body.discount.code).toBe(sampleDiscount.code);
      expect(res.body.discount.type).toBe(sampleDiscount.type);
      expect(res.body.discount.value).toBe(sampleDiscount.value);
      expect(res.body.discount.timesUsed).toBe(0);
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(serverUrl)
        .post("/api/discounts")
        .send(sampleDiscount);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized");
    });

    it("should return 403 when non-organizer tries to create discount", async () => {
      const res = await request(serverUrl)
        .post("/api/discounts")
        .set("Authorization", `Bearer ${attendeeToken}`)
        .send(sampleDiscount);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Forbidden");
    });

    it("should return 400 when required fields are missing", async () => {
      const invalidDiscount = {
        code: "TEST50"
        // missing type and value
      };

      const res = await request(serverUrl)
        .post("/api/discounts")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send(invalidDiscount);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Code, type, and value are required");
    });

    it("should return 400 when discount type is invalid", async () => {
      const invalidDiscount = {
        ...sampleDiscount,
        type: "InvalidType"
      };

      const res = await request(serverUrl)
        .post("/api/discounts")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send(invalidDiscount);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Type must be either "Percentage" or "Fixed Amount"');
    });

    it("should return 400 when percentage value is invalid", async () => {
      const invalidDiscount = {
        ...sampleDiscount,
        value: 150 // Over 100%
      };

      const res = await request(serverUrl)
        .post("/api/discounts")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send(invalidDiscount);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Percentage value must be between 0 and 100");
    });

    it("should return 400 when value is negative", async () => {
      const invalidDiscount = {
        ...sampleDiscount,
        value: -50
      };

      const res = await request(serverUrl)
        .post("/api/discounts")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send(invalidDiscount);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Percentage value must be between 0 and 100");
    });

    it("should return 409 when discount code already exists", async () => {
      // Create a discount first
      await prisma.discount.create({
        data: sampleDiscount
      });

      // Try to create the same discount
      const res = await request(serverUrl)
        .post("/api/discounts")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send(sampleDiscount);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Discount code already exists");
    });
  });

  describe("GET /api/discounts/[id]", () => {
    let testDiscount;

    beforeEach(async () => {
      await prisma.discount.deleteMany();
      testDiscount = await prisma.discount.create({
        data: sampleDiscount
      });
    });

    it("should return discount details when organizer is authenticated", async () => {
      const res = await request(serverUrl)
        .get(`/api/discounts/${testDiscount.id}`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.discount.id).toBe(testDiscount.id);
      expect(res.body.discount.code).toBe(testDiscount.code);
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(serverUrl)
        .get(`/api/discounts/${testDiscount.id}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized");
    });

    it("should return 403 when non-organizer tries to access discount", async () => {
      const res = await request(serverUrl)
        .get(`/api/discounts/${testDiscount.id}`)
        .set("Authorization", `Bearer ${attendeeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Forbidden");
    });

    it("should return 404 for non-existent discount", async () => {
      const res = await request(serverUrl)
        .get("/api/discounts/999999")
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Discount not found");
    });

    it("should return 400 for invalid discount ID", async () => {
      const res = await request(serverUrl)
        .get("/api/discounts/invalid-id")
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid discount ID");
    });
  });
}); 