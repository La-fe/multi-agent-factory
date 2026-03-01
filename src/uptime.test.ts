import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { uptimeHandler } from "./uptime.js";

function createApp() {
  const app = express();
  app.get("/uptime", uptimeHandler);
  return app;
}

describe("GET /uptime", () => {
  it("returns uptime in seconds and human-readable format", async () => {
    const res = await request(createApp()).get("/uptime");
    expect(res.status).toBe(200);
    expect(typeof res.body.uptime_seconds).toBe("number");
    expect(res.body.uptime_seconds).toBeGreaterThanOrEqual(0);
    expect(res.body.uptime_human).toMatch(/^\d+d \d+h \d+m \d+s$/);
  });

  it("returns a valid ISO 8601 started_at timestamp", async () => {
    const res = await request(createApp()).get("/uptime");
    expect(res.body).toHaveProperty("started_at");
    const parsed = Date.parse(res.body.started_at);
    expect(Number.isNaN(parsed)).toBe(false);
  });
});
