import { beforeEach, describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { clearTodos, createTodo } from "./store.js";
import { searchTodos } from "./search.js";

function createApp() {
  const app = express();
  app.get("/todos/search", searchTodos);
  return app;
}

describe("GET /todos/search", () => {
  beforeEach(() => clearTodos());

  it("returns 400 without query", async () => {
    const res = await request(createApp()).get("/todos/search");
    expect(res.status).toBe(400);
  });

  it("finds matching todos", async () => {
    createTodo("Buy groceries");
    createTodo("Buy milk");
    createTodo("Read book");

    const res = await request(createApp()).get("/todos/search?q=buy");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("returns empty array for no matches", async () => {
    createTodo("Buy groceries");
    const res = await request(createApp()).get("/todos/search?q=xyz");
    expect(res.body).toHaveLength(0);
  });
});
