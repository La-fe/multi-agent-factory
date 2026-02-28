import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { healthCheck } from "./health.js";

function createApp() {
  const app = express();
  app.get("/health", healthCheck);
  return app;
}

describe("GET /health", () => {
  it("returns ok status", async () => {
    const res = await request(createApp()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("includes uptime and timestamp", async () => {
    const res = await request(createApp()).get("/health");
    expect(res.body).toHaveProperty("uptime");
    expect(res.body).toHaveProperty("timestamp");
    expect(typeof res.body.uptime).toBe("number");
    expect(typeof res.body.timestamp).toBe("string");
  });

  it("returns timestamp in ISO 8601 format", async () => {
    const res = await request(createApp()).get("/health");
    const ts = res.body.timestamp as string;
    // ISO 8601: YYYY-MM-DDTHH:mm:ss.sssZ
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(new Date(ts).toISOString()).toBe(ts);
  });
});
