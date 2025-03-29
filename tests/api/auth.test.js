const request = require("supertest");
const serverUrl = "http://localhost:3000";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

describe("Authentication API", () => {
  const sampleUser = {
    email: "test@example.com",
    password: "password123",
    role: "Attendee"
  };

  // Setup before running tests
  beforeAll(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe("POST /api/register", () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
    });

    it("should register a new user", async () => {
      const res = await request(serverUrl)
        .post("/api/register")
        .send(sampleUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("User registered successfully");
      expect(res.body.user).toHaveProperty("id");
      expect(res.body.user.email).toBe(sampleUser.email);
      expect(res.body.user.role).toBe(sampleUser.role);
      expect(typeof res.body.token).toBe("string");
    });

    it("should return 400 if required fields are missing", async () => {
      const invalidUser = { email: "test@example.com" };
      const res = await request(serverUrl)
        .post("/api/register")
        .send(invalidUser);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Email and password are required");
    });

    it("should return 409 if user already exists", async () => {
      // Create a user first
      await prisma.user.create({
        data: sampleUser
      });

      // Try to register the same user
      const res = await request(serverUrl)
        .post("/api/register")
        .send(sampleUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("User already exists");
    });

    it("should validate email format", async () => {
      const invalidEmailUser = {
        email: "invalid-email",
        password: "password123",
        role: "Attendee"
      };
      const res = await request(serverUrl)
        .post("/api/register")
        .send(invalidEmailUser);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid email format");
    });

    it("should validate password strength", async () => {
      const weakPasswordUser = {
        email: "test@example.com",
        password: "123",
        role: "Attendee"
      };
      const res = await request(serverUrl)
        .post("/api/register")
        .send(weakPasswordUser);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Password must be at least 8 characters long");
    });

    it("should validate role", async () => {
      const invalidRoleUser = {
        email: "test@example.com",
        password: "password123",
        role: "InvalidRole"
      };
      const res = await request(serverUrl)
        .post("/api/register")
        .send(invalidRoleUser);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid role. Role must be one of: Attendee, Organizer, Admin");
    });

    it("should handle whitespace in email", async () => {
      const userWithWhitespace = {
        email: "  test@example.com  ",
        password: "password123",
        role: "Attendee"
      };
      const res = await request(serverUrl)
        .post("/api/register")
        .send(userWithWhitespace);

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe("test@example.com");
    });
  });

  describe("POST /api/login", () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      const hashedPassword = await bcrypt.hash(sampleUser.password, 10);
      await prisma.user.create({
        data: {
          ...sampleUser,
          password: hashedPassword
        }
      });
    });

    it("should login an existing user", async () => {
      const res = await request(serverUrl)
        .post("/api/login")
        .send({
          email: sampleUser.email,
          password: sampleUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.user).toHaveProperty("id");
      expect(res.body.user.email).toBe(sampleUser.email);
      expect(res.body.user.role).toBe(sampleUser.role);
      expect(typeof res.body.token).toBe("string");
    });

    it("should return 401 if user does not exist", async () => {
      const res = await request(serverUrl)
        .post("/api/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123"
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid credentials");
    });

    it("should return 401 if password is incorrect", async () => {
      const res = await request(serverUrl)
        .post("/api/login")
        .send({
          email: sampleUser.email,
          password: "wrongpassword"
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid credentials");
    });

    it("should return 400 if required fields are missing", async () => {
      const res = await request(serverUrl)
        .post("/api/login")
        .send({
          email: sampleUser.email
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Email and password are required");
    });
    
    it("should trim whitespace from email", async () => {
      const res = await request(serverUrl)
        .post("/api/login")
        .send({
          email: `  ${sampleUser.email}  `,
          password: sampleUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(sampleUser.email);
    });

    it("should be case insensitive for email", async () => {
      const res = await request(serverUrl)
        .post("/api/login")
        .send({
          email: sampleUser.email.toUpperCase(),
          password: sampleUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(sampleUser.email);
    });
  });
}); 