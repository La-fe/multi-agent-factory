import express, { type Express } from "express";
import {
  createTodo,
  deleteTodo,
  getTodo,
  listTodos,
  updateTodo,
} from "./store.js";

export const app: Express = express();
app.use(express.json());

// List all todos
app.get("/todos", (_req, res) => {
  res.json(listTodos());
});

// Get single todo
app.get("/todos/:id", (req, res) => {
  const todo = getTodo(req.params.id);
  if (!todo) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }
  res.json(todo);
});

// Create todo
app.post("/todos", (req, res) => {
  const { title } = req.body as { title?: string };
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    res.status(400).json({ error: "Title is required" });
    return;
  }
  const todo = createTodo(title.trim());
  res.status(201).json(todo);
});

// Update todo
app.put("/todos/:id", (req, res) => {
  const { title, completed } = req.body as {
    title?: string;
    completed?: boolean;
  };
  const todo = updateTodo(req.params.id, { title, completed });
  if (!todo) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }
  res.json(todo);
});

// Delete todo
app.delete("/todos/:id", (req, res) => {
  const deleted = deleteTodo(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }
  res.status(204).send();
});
