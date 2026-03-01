import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./app.js";

describe("app", () => {
  it("GET /health returns 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /favicon.ico returns 204", async () => {
    const res = await request(app).get("/favicon.ico");
    expect(res.status).toBe(204);
  });
});
