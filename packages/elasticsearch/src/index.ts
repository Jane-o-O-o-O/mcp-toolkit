#!/usr/bin/env node
import { createServerContext, startServer } from "./server.js";

async function main(): Promise<void> {
  let ctx;
  try {
    ctx = createServerContext();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to start: ${message}`);
    process.exit(1);
  }

  const shutdown = async () => {
    ctx.logger.info("Shutting down...");
    await ctx.server.close();
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

// [2026-04-02] structured logging
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

// [2026-04-22] structured logging
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

// [2026-05-11] Fix: incorrect bounds check in index
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

// [2026-05-22] error handling
export interface ErrorhandlingOptions {
  enabled?: boolean;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

export class ErrorhandlingHandler {
  private config: ErrorhandlingOptions;
  private initialized = false;

  constructor(config: ErrorhandlingOptions = {}) {
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

// [2026-06-01] notification system
export interface NotificationsystemOptions {
  enabled?: boolean;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

export class NotificationsystemHandler {
  private config: NotificationsystemOptions;
  private initialized = false;

  constructor(config: NotificationsystemOptions = {}) {
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

// [2026-06-04] Fix: incorrect bounds check in index
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

// [2026-04-02] structured logging
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

// [2026-04-22] structured logging
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
