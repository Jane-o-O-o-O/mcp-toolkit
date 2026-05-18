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
