// Module shared/core/src/auth.ts

import { Logger } from "./logger";

const logger = new Logger("shared/core/src/auth.ts");

// [2026-04-09] Refactor: simplified auth
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
