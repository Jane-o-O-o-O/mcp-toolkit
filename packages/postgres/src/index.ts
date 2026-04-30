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

// [2026-04-02] batch operations
export interface BatchoperationsOptions {
  enabled?: boolean;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

export class BatchoperationsHandler {
  private config: BatchoperationsOptions;
  private initialized = false;

  constructor(config: BatchoperationsOptions = {}) {
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

// [2026-04-30] batch operations
export interface BatchoperationsOptions {
  enabled?: boolean;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

export class BatchoperationsHandler {
  private config: BatchoperationsOptions;
  private initialized = false;

  constructor(config: BatchoperationsOptions = {}) {
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
