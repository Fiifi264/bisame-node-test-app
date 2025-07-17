import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "./src/index";

describe("Login API Tests", () => {
  // Mock user data (in a real test, use DB seed or test DB)
  const users = {
    customer: {
      email: "cust@example.com",
      password: "password123",
      role: "customer",
      active: true,
    },
    vendor: {
      email: "vendor@example.com",
      password: "password123",
      role: "vendor",
      active: true,
    },
    admin: {
      email: "admin@example.com",
      password: "password123",
      role: "admin",
      active: true,
    },
    staff: {
      email: "staff@example.com",
      password: "password123",
      role: "staff",
      active: true,
      vendorId: "vendor123",
    },
    banned: {
      email: "banned@example.com",
      password: "password123",
      role: "customer",
      active: false,
      banned: true,
    },
  };

  // Helper to simulate user login request
  async function login(email: string, password: string) {
    return request(app).post("/login").send({ email, password });
  }

  it("Valid login for customer returns JWT access & refresh token", async () => {
    const res = await login(users.customer.email, users.customer.password);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");

    const decoded = jwt.decode(res.body.accessToken) as any;
    expect(decoded.role).toBe("customer");
  });

  it("Valid login for vendor returns correct role-based tokens", async () => {
    const res = await login(users.vendor.email, users.vendor.password);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");

    const decoded = jwt.decode(res.body.accessToken) as any;
    expect(decoded.role).toBe("vendor");
  });

  it("Valid login for admin/staff returns correct token and permissions", async () => {
    // Admin
    let res = await login(users.admin.email, users.admin.password);
    expect(res.status).toBe(200);
    let decoded = jwt.decode(res.body.accessToken) as any;
    expect(decoded.role).toBe("admin");
    expect(decoded.permissions).toContain("manage_users"); // example permission

    // Staff
    res = await login(users.staff.email, users.staff.password);
    expect(res.status).toBe(200);
    decoded = jwt.decode(res.body.accessToken) as any;
    expect(decoded.role).toBe("staff");
    expect(decoded.permissions).toContain("access_assigned_vendor_data");
  });

  it("Invalid credentials return 401 Unauthorized", async () => {
    const res = await login("wrong@example.com", "wrongpassword");
    expect(res.status).toBe(401);
  });

  it("Inactive or banned users cannot log in", async () => {
    const res = await login(users.banned.email, users.banned.password);
    expect(res.status).toBe(403); // or 401 depending on your logic
  });

  it("Vendor staff can access only their assigned vendor data", async () => {
    const res = await login(users.staff.email, users.staff.password);
    expect(res.status).toBe(200);
    const decoded = jwt.decode(res.body.accessToken) as any;
    expect(decoded.vendorId).toBe(users.staff.vendorId);

    // Further test example: Attempt to access vendor data API
    const vendorDataRes = await request(app)
      .get(`/vendor/${decoded.vendorId}/data`)
      .set("Authorization", `Bearer ${res.body.accessToken}`);

    expect(vendorDataRes.status).toBe(200);

    // Attempt to access data for another vendor should be forbidden
    const forbiddenRes = await request(app)
      .get(`/vendor/anotherVendor/data`)
      .set("Authorization", `Bearer ${res.body.accessToken}`);

    expect(forbiddenRes.status).toBe(403);
  });
});
