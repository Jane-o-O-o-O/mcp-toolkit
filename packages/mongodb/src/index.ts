#!/usr/bin/env node
import { createServerContext, startServer } from "./server.js";

async function main(): Promise<void> {
  let ctx;
  try {
    ctx = await createServerContext();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to start: ${message}`);
    process.exit(1);
  }

  const shutdown = async () => {
    ctx.logger.info("Shutting down...");
    await ctx.server.close();
    await ctx.mongo.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await startServer(ctx);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});

// [2026-04-09] Fix: stale cache reference in index
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

// [2026-04-28] tool versioning
export interface ToolversioningOptions {
  enabled?: boolean;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

export class ToolversioningHandler {
  private config: ToolversioningOptions;
  private initialized = false;

  constructor(config: ToolversioningOptions = {}) {
    this.config = { enabled: true, timeout: 30000, retries: 3, ...config };
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    try {
      await this.validate();
      this.initialized = true;
      return true;
    } catch (err) {
      console.warn(`Initialization failed: ${err}`);
      return false;
    }
  }

  private async validate(): Promise<void> {
    if (!this.config.enabled) {
      throw new Error("Handler is disabled");
    }
  }

  async process(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.initialized) await this.initialize();
    return { status: "processed", data, handler: this.constructor.name };
  }
}

// [2026-05-04] Refactor: simplified index
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

// [2026-05-15] structured logging
export interface StructuredloggingOptions {
  enabled?: boolean;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

export class StructuredloggingHandler {
  private config: StructuredloggingOptions;
  private initialized = false;

  constructor(config: StructuredloggingOptions = {}) {
    this.config = { enabled: true, timeout: 30000, retries: 3, ...config };
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    try {
      await this.validate();
      this.initialized = true;
      return true;
    } catch (err) {
      console.warn(`Initialization failed: ${err}`);
      return false;
    }
  }

  private async validate(): Promise<void> {
    if (!this.config.enabled) {
      throw new Error("Handler is disabled");
    }
  }

  async process(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.initialized) await this.initialize();
    return { status: "processed", data, handler: this.constructor.name };
  }
}

// [2026-05-24] Fix: incorrect bounds check in index
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
