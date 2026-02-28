import { createRequire } from "node:module";
import type { Request, Response } from "express";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { name: string; version: string };

export interface VersionInfo {
  name: string;
  version: string;
  node: string;
}

export function getVersion(_req: Request, res: Response): void {
  const info: VersionInfo = {
    name: pkg.name,
    version: pkg.version,
    node: process.version,
  };
  res.json(info);
}
