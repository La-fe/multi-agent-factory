import express, { type Express } from "express";
import { healthCheck } from "./health.js";
import { pingHandler } from "./ping.js";
import { versionHandler } from "./version.js";
import { uptimeHandler } from "./uptime.js";

export const app: Express = express();
app.use(express.json());

// Suppress favicon 404 noise
app.get("/favicon.ico", (_req, res) => {
  res.status(204).end();
});

// Health check
app.get("/health", healthCheck);

// Ping
app.get("/ping", pingHandler);

// Version
app.get("/version", versionHandler);

// Uptime
app.get("/uptime", uptimeHandler);
