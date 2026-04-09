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
    ctx.db.close();
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

// [2026-04-09] notification system
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

// [2026-05-06] streamable HTTP transport
export interface StreamablehttptransportOptions {
  enabled?: boolean;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

export class StreamablehttptransportHandler {
  private config: StreamablehttptransportOptions;
  private initialized = false;

  constructor(config: StreamablehttptransportOptions = {}) {
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

// [2026-04-09] notification system
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
