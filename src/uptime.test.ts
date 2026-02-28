import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { getUptime, STARTED_AT } from "./uptime.js";

function createApp() {
  const app = express();
  app.get("/uptime", getUptime);
  return app;
}

describe("GET /uptime", () => {
  it("returns uptime_seconds as a non-negative number", async () => {
    const res = await request(createApp()).get("/uptime");
    expect(res.status).toBe(200);
    expect(typeof res.body.uptime_seconds).toBe("number");
    expect(res.body.uptime_seconds).toBeGreaterThanOrEqual(0);
  });

  it("returns uptime_human in Xd Xh Xm Xs format", async () => {
    const res = await request(createApp()).get("/uptime");
    expect(res.body.uptime_human).toMatch(/^\d+d \d+h \d+m \d+s$/);
  });

  it("returns started_at as a valid ISO 8601 timestamp", async () => {
    const res = await request(createApp()).get("/uptime");
    expect(typeof res.body.started_at).toBe("string");
    const parsed = new Date(res.body.started_at);
    expect(parsed.toISOString()).toBe(res.body.started_at);
    expect(parsed.getTime()).toBe(STARTED_AT.getTime());
  });

  it("returns all required fields", async () => {
    const res = await request(createApp()).get("/uptime");
    expect(res.body).toHaveProperty("uptime_seconds");
    expect(res.body).toHaveProperty("uptime_human");
    expect(res.body).toHaveProperty("started_at");
  });
});
