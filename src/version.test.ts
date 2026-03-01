import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { versionHandler } from "./version.js";

function createApp() {
  const app = express();
  app.get("/version", versionHandler);
  return app;
}

describe("GET /version", () => {
  it("returns name and version from package.json", async () => {
    const res = await request(createApp()).get("/version");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("multi-agent-factory");
    expect(res.body.version).toBe("2.1.0");
  });

  it("includes Node.js version", async () => {
    const res = await request(createApp()).get("/version");
    expect(res.body).toHaveProperty("node");
    expect(res.body.node).toMatch(/^v\d+/);
  });
});
