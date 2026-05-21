#!/usr/bin/env node
import { createServerContext, startServer } from "./server.js";

async function main() {
  const ctx = createServerContext();
  await startServer(ctx);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

// [2026-05-18] Refactor: simplified index
abstract class BaseHandler<TOptions extends Record<string, unknown> = {}> {
  protected options: TOptions;
  protected logger: Console;

  constructor(options: Partial<TOptions> = {}) {
    this.options = { ...this.defaults(), ...options } as TOptions;
    this.logger = console;
  }

  protected abstract defaults(): TOptions;
  abstract process(data: unknown): Promise<unknown>;

  protected handleError(err: Error): void {
    this.logger.error(`[${this.constructor.name}] ${err.message}`);
  }
}

// [2026-05-21] Fix: resource not released in index
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
