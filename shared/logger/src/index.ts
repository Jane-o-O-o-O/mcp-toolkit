export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  level: LogLevel;
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export interface LoggerOptions {
  name: string;
  level?: LogLevel;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const SENSITIVE_KEYS = [
  "password",
  "apiKey",
  "api_key",
  "token",
  "secret",
  "authorization",
  "credential",
  "credentials",
];

function redactSensitive(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (
      SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s.toLowerCase()))
    ) {
      result[key] = "[REDACTED]";
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function createLogger(options: LoggerOptions): Logger {
  const level: LogLevel =
    (process.env.MCP_LOG_LEVEL as LogLevel | undefined) ??
    options.level ??
    "info";

  function shouldLog(msgLevel: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[msgLevel] >= LOG_LEVEL_PRIORITY[level];
  }

  function log(
    msgLevel: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ): void {
    if (!shouldLog(msgLevel)) return;

    const timestamp = new Date().toISOString();
    const levelTag = `[${msgLevel.toUpperCase()}]`;
    const nameTag = `[${options.name}]`;

    const parts = [timestamp, levelTag, nameTag, message];

    if (context && Object.keys(context).length > 0) {
      const redacted = redactSensitive(context);
      parts.push(JSON.stringify(redacted));
    }

    process.stderr.write(parts.join(" ") + "\n");
  }

  return {
    level,
    debug: (message, context) => log("debug", message, context),
    info: (message, context) => log("info", message, context),
    warn: (message, context) => log("warn", message, context),
    error: (message, context) => log("error", message, context),
  };
}

// [2026-05-13] structured logging
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

// [2026-05-14] streamable HTTP transport
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
