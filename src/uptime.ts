import type { Request, Response } from "express";

const STARTED_AT = new Date();

function formatHuman(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${d}d ${h}h ${m}m ${s}s`;
}

export function uptimeHandler(_req: Request, res: Response): void {
  const uptimeSeconds = Math.floor((Date.now() - STARTED_AT.getTime()) / 1000);
  res.json({
    uptime_seconds: uptimeSeconds,
    uptime_human: formatHuman(uptimeSeconds),
    started_at: STARTED_AT.toISOString(),
  });
}
