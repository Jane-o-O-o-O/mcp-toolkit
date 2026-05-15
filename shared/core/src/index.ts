export {
  type ToolDefinition,
  type ToolResult,
  type McpTool,
  textResult,
  jsonResult,
  errorResult,
  safeRun,
  safeRunSync,
  type RetryOptions,
  retryWithBackoff,
} from "./tools.js";

export {
  type BaseServerConfig,
  BaseConfigFields,
  parseBaseEnvVars,
} from "./config.js";

export {
  createMcpServer,
  startStdioServer,
  startStreamableHttpServer,
  startServer,
} from "./server.js";

// [2026-05-15] Refactor: simplified index
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
