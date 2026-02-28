import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { echoHandler } from "./echo.js";

function createApp() {
  const app = express();
  app.use(express.json());
  app.get("/echo", echoHandler);
  app.post("/echo", echoHandler);
  return app;
}

describe("GET /echo", () => {
  it("returns method, path, and timestamp", async () => {
    const res = await request(createApp()).get("/echo");
    expect(res.status).toBe(200);
    expect(res.body.method).toBe("GET");
    expect(res.body.path).toBe("/echo");
    expect(typeof res.body.timestamp).toBe("string");
  });

  it("returns headers", async () => {
    const res = await request(createApp())
      .get("/echo")
      .set("x-custom-header", "test-value");
    expect(res.body.headers).toHaveProperty("x-custom-header", "test-value");
  });

  it("returns query params", async () => {
    const res = await request(createApp()).get("/echo?foo=bar&baz=qux");
    expect(res.body.query).toEqual({ foo: "bar", baz: "qux" });
  });

  it("does not include body field", async () => {
    const res = await request(createApp()).get("/echo");
    expect(res.body).not.toHaveProperty("body");
  });
});

describe("POST /echo", () => {
  it("returns method, path, and timestamp", async () => {
    const res = await request(createApp())
      .post("/echo")
      .send({ hello: "world" });
    expect(res.status).toBe(200);
    expect(res.body.method).toBe("POST");
    expect(res.body.path).toBe("/echo");
    expect(typeof res.body.timestamp).toBe("string");
  });

  it("returns headers", async () => {
    const res = await request(createApp())
      .post("/echo")
      .set("x-custom-header", "test-value")
      .send({});
    expect(res.body.headers).toHaveProperty("x-custom-header", "test-value");
  });

  it("returns request body", async () => {
    const res = await request(createApp())
      .post("/echo")
      .send({ key: "value", num: 42 });
    expect(res.body.body).toEqual({ key: "value", num: 42 });
  });

  it("does not include query field", async () => {
    const res = await request(createApp()).post("/echo").send({});
    expect(res.body).not.toHaveProperty("query");
  });
});
