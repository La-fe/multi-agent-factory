import express, { type Express } from "express";
import { healthCheck } from "./health.js";

export const app: Express = express();
app.use(express.json());

// Suppress favicon 404 noise
app.get("/favicon.ico", (_req, res) => {
  res.status(204).end();
});

// Health check
app.get("/health", healthCheck);
