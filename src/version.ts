import { createRequire } from "node:module";
import type { Request, Response } from "express";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { name: string; version: string };

export function versionHandler(_req: Request, res: Response): void {
  res.json({
    name: pkg.name,
    version: pkg.version,
    node: process.version,
  });
}
