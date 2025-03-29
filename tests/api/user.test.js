const request = require("supertest");
const serverUrl = "http://localhost:3000";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

describe("User API", () => {
  let user;
  let userToken;

  beforeAll(async () => {
    // Clean up database
    await prisma.user.deleteMany();

    // Create test user
    user = await prisma.user.create({
      data: {
        email: "test@example.com",
        password: "hashedpassword",
        role: "Attendee"
      }
    });

    // Generate token
    userToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET
    );
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe("GET /api/user", () => {
    it("should return user details when authenticated", async () => {
      const res = await request(serverUrl)
        .get("/api/user")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.id).toBe(user.id);
      expect(res.body.user.email).toBe(user.email);
      expect(res.body.user.role).toBe(user.role);
      expect(res.body.user.password).toBeUndefined(); // Password should not be returned
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(serverUrl)
        .get("/api/user");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized");
    });

    it("should return 401 when invalid token is provided", async () => {
      const res = await request(serverUrl)
        .get("/api/user")
        .set("Authorization", "Bearer invalid-token");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized");
    });

    it("should return 401 when token is malformed", async () => {
      const res = await request(serverUrl)
        .get("/api/user")
        .set("Authorization", "Bearer");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized");
    });

    it("should return 401 when user does not exist", async () => {
      // Delete the user but keep the token
      await prisma.user.delete({
        where: { id: user.id }
      });

      const res = await request(serverUrl)
        .get("/api/user")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized");

      // Recreate the user for other tests
      user = await prisma.user.create({
        data: {
          email: "test@example.com",
          password: "hashedpassword",
          role: "Attendee"
        }
      });
    });
  });
}); 