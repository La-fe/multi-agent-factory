import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { getVersion } from "./version.js";

function createApp() {
  const app = express();
  app.get("/version", getVersion);
  return app;
}

describe("GET /version", () => {
  it("returns name and version from package.json", async () => {
    const res = await request(createApp()).get("/version");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("multi-agent-factory");
    expect(res.body.version).toBe("0.1.0");
  });

  it("includes node version", async () => {
    const res = await request(createApp()).get("/version");
    expect(res.body).toHaveProperty("node");
    expect(typeof res.body.node).toBe("string");
    expect(res.body.node).toBe(process.version);
  });
});
