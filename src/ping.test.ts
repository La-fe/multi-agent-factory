import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { ping } from "./ping.js";

function createApp() {
  const app = express();
  app.get("/ping", ping);
  return app;
}

describe("GET /ping", () => {
  it("returns 200 with pong and timestamp", async () => {
    const res = await request(createApp()).get("/ping");
    expect(res.status).toBe(200);
    expect(res.body.pong).toBe(true);
    expect(typeof res.body.timestamp).toBe("string");
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });
});
