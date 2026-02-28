import { beforeEach, describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { clearTodos, createTodo, updateTodo } from "./store.js";
import { getStats } from "./stats.js";

function createApp() {
	const app = express();
	app.get("/stats", getStats);
	return app;
}

describe("GET /stats", () => {
	beforeEach(() => clearTodos());

	it("returns zeros when no todos", async () => {
		const res = await request(createApp()).get("/stats");
		expect(res.status).toBe(200);
		expect(res.body).toEqual({
			total: 0,
			completed: 0,
			pending: 0,
			completionRate: 0,
		});
	});

	it("calculates completion rate correctly", async () => {
		createTodo("Task 1");
		const todo2 = createTodo("Task 2");
		createTodo("Task 3");
		updateTodo(todo2.id, { completed: true });

		const res = await request(createApp()).get("/stats");
		expect(res.body.total).toBe(3);
		expect(res.body.completed).toBe(1);
		expect(res.body.pending).toBe(2);
		expect(res.body.completionRate).toBe(33);
	});
});
