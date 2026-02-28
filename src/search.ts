import type { Request, Response } from "express";
import { listTodos } from "./store.js";

export function searchTodos(req: Request, res: Response): void {
	const query = (req.query.q as string | undefined) ?? "";
	if (query.trim().length === 0) {
		res.status(400).json({ error: "Query parameter 'q' is required" });
		return;
	}
	const lower = query.toLowerCase();
	const results = listTodos().filter((t) =>
		t.title.toLowerCase().includes(lower),
	);
	res.json(results);
}
