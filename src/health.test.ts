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
});
