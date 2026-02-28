import type { Request, Response } from "express";

export interface EchoResponse {
  method: string;
  path: string;
  timestamp: string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export function echoHandler(req: Request, res: Response): void {
  const base: EchoResponse = {
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString(),
    headers: req.headers as Record<string, string | string[] | undefined>,
  };

  if (req.method === "GET") {
    res.json({
      ...base,
      query: req.query as Record<string, string | string[] | undefined>,
    });
  } else {
    res.json({
      ...base,
      body: req.body,
    });
  }
}
