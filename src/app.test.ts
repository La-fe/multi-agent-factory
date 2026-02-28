import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "./app.js";
import { clearTodos } from "./store.js";

beforeEach(() => {
  clearTodos();
});

describe("API", () => {
  describe("GET /favicon.ico", () => {
    it("returns 204 silently", async () => {
      const res = await request(app).get("/favicon.ico");
      expect(res.status).toBe(204);
    });
  });

  describe("POST /todos", () => {
    it("creates a todo", async () => {
      const res = await request(app).post("/todos").send({ title: "Buy milk" });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Buy milk");
      expect(res.body.completed).toBe(false);
    });

    it("rejects empty title", async () => {
      const res = await request(app).post("/todos").send({ title: "" });
      expect(res.status).toBe(400);
    });

    it("rejects missing title", async () => {
      const res = await request(app).post("/todos").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("GET /todos", () => {
    it("returns empty list", async () => {
      const res = await request(app).get("/todos");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns all todos", async () => {
      await request(app).post("/todos").send({ title: "A" });
      await request(app).post("/todos").send({ title: "B" });

      const res = await request(app).get("/todos");
      expect(res.body).toHaveLength(2);
    });
  });

  describe("GET /todos/:id", () => {
    it("returns existing todo", async () => {
      const created = await request(app).post("/todos").send({ title: "Test" });

      const res = await request(app).get(`/todos/${created.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Test");
    });

    it("returns 404 for missing", async () => {
      const res = await request(app).get("/todos/999");
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /todos/:id", () => {
    it("updates todo", async () => {
      const created = await request(app).post("/todos").send({ title: "Old" });

      const res = await request(app)
        .put(`/todos/${created.body.id}`)
        .send({ title: "New", completed: true });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("New");
      expect(res.body.completed).toBe(true);
    });

    it("returns 404 for missing", async () => {
      const res = await request(app).put("/todos/999").send({ title: "X" });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /todos/:id", () => {
    it("deletes todo", async () => {
      const created = await request(app)
        .post("/todos")
        .send({ title: "Delete me" });

      const res = await request(app).delete(`/todos/${created.body.id}`);
      expect(res.status).toBe(204);
    });

    it("returns 404 for missing", async () => {
      const res = await request(app).delete("/todos/999");
      expect(res.status).toBe(404);
    });
  });
});
