const request = require("supertest");
const serverUrl = "http://localhost:3000";

describe("Logout API", () => {
  describe("POST /api/logout", () => {
    it("should successfully log out", async () => {
      const res = await request(serverUrl)
        .post("/api/logout");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Logout successful");
    });
  });
}); 