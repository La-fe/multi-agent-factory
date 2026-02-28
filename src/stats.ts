import type { Request, Response } from "express";
import { listTodos } from "./store.js";

export interface Stats {
	total: number;
	completed: number;
	pending: number;
	completionRate: number;
}

export function getStats(_req: Request, res: Response): void {
	const todos = listTodos();
	const completed = todos.filter((t) => t.completed).length;
	const total = todos.length;
	const stats: Stats = {
		total,
		completed,
		pending: total - completed,
		completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
	};
	res.json(stats);
}
