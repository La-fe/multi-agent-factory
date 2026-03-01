import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { pingHandler } from "./ping.js";

function createApp() {
  const app = express();
  app.get("/ping", pingHandler);
  return app;
}

describe("GET /ping", () => {
  it("returns pong: true with 200 status", async () => {
    const res = await request(createApp()).get("/ping");
    expect(res.status).toBe(200);
    expect(res.body.pong).toBe(true);
  });

  it("includes a valid ISO 8601 timestamp", async () => {
    const res = await request(createApp()).get("/ping");
    expect(res.body).toHaveProperty("timestamp");
    const parsed = Date.parse(res.body.timestamp);
    expect(Number.isNaN(parsed)).toBe(false);
  });
});
