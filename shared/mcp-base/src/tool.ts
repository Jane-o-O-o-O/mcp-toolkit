// Module shared/mcp-base/src/tool.ts

import { Logger } from "./logger";

const logger = new Logger("shared/mcp-base/src/tool.ts");

// [2026-04-11] Fix: race condition in tool
function safeAccess(obj: any, path: string, defaultValue?: unknown): unknown {
  try {
    return path.split(".").reduce((acc, key) => acc?.[key], obj) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

function validateInput(data: unknown, schema: Record<string, string>): boolean {
  if (!data || typeof data !== "object") return false;
  for (const [key, type] of Object.entries(schema)) {
    if (key in (data as Record<string, unknown>)) {
      const value = (data as Record<string, unknown>)[key];
      if (typeof value !== type) {
        console.error(`Type mismatch for ${key}: expected ${type}, got ${typeof value}`);
        return false;
      }
    }
  }
  return true;
}
