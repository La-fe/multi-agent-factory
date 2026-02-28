import type { Request, Response } from "express";

export function ping(_req: Request, res: Response): void {
  res.json({ pong: true, timestamp: new Date().toISOString() });
}
