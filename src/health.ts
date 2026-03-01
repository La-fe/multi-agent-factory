import type { Request, Response } from "express";

export interface HealthStatus {
  status: "ok" | "degraded";
  uptime: number;
  timestamp: string;
}

const startTime = Date.now();

export function healthCheck(_req: Request, res: Response): void {
  const status: HealthStatus = {
    status: "ok",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  };
  res.json(status);
}
