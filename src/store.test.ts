import { describe, it, expect, beforeEach } from "vitest";
import {
  createTodo,
  getTodo,
  listTodos,
  updateTodo,
  deleteTodo,
  clearTodos,
} from "./store.js";

beforeEach(() => {
  clearTodos();
});

describe("store", () => {
  describe("createTodo", () => {
    it("creates a todo with title", () => {
      const todo = createTodo("Buy milk");
      expect(todo.title).toBe("Buy milk");
      expect(todo.completed).toBe(false);
      expect(todo.id).toBeDefined();
      expect(todo.createdAt).toBeDefined();
    });

    it("assigns unique IDs", () => {
      const a = createTodo("First");
      const b = createTodo("Second");
      expect(a.id).not.toBe(b.id);
    });
  });

  describe("getTodo", () => {
    it("returns existing todo", () => {
      const created = createTodo("Test");
      const found = getTodo(created.id);
      expect(found).toEqual(created);
    });

    it("returns undefined for missing ID", () => {
      expect(getTodo("999")).toBeUndefined();
    });
  });

  describe("listTodos", () => {
    it("returns empty array initially", () => {
      expect(listTodos()).toEqual([]);
    });

    it("returns all todos", () => {
      createTodo("A");
      createTodo("B");
      expect(listTodos()).toHaveLength(2);
    });
  });

  describe("updateTodo", () => {
    it("updates title", () => {
      const todo = createTodo("Old");
      const updated = updateTodo(todo.id, { title: "New" });
      expect(updated?.title).toBe("New");
    });

    it("updates completed status", () => {
      const todo = createTodo("Task");
      const updated = updateTodo(todo.id, { completed: true });
      expect(updated?.completed).toBe(true);
    });

    it("returns undefined for missing ID", () => {
      expect(updateTodo("999", { title: "X" })).toBeUndefined();
    });
  });

  describe("deleteTodo", () => {
    it("deletes existing todo", () => {
      const todo = createTodo("Delete me");
      expect(deleteTodo(todo.id)).toBe(true);
      expect(getTodo(todo.id)).toBeUndefined();
    });

    it("returns false for missing ID", () => {
      expect(deleteTodo("999")).toBe(false);
    });
  });
});
