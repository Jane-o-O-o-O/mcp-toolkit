/** MCP Tool definition matching the MCP SDK schema */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/** Result returned by a tool handler */
export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

/** A complete MCP tool with its definition and handler */
export interface McpTool {
  definition: ToolDefinition;
  handler: (args: Record<string, unknown>) => Promise<ToolResult>;
}

/** Create a success result with text content */
export function textResult(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

/** Create a JSON success result */
export function jsonResult(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

/** Create an error result */
export function errorResult(message: string): ToolResult {
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}

/** Wrap an async operation with standardized error handling */
export async function safeRun<T>(
  fn: () => Promise<T>,
  format?: (result: T) => string,
): Promise<ToolResult> {
  try {
    const result = await fn();
    if (format) return textResult(format(result));
    return textResult(String(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResult(message);
  }
}

/** Retry configuration */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts: number;
  /** Initial delay in ms before first retry (default: 1000) */
  initialDelayMs: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier: number;
  /** Maximum delay in ms between retries (default: 30000) */
  maxDelayMs: number;
  /** Optional predicate to decide if the error is retryable */
  isRetryable?: (error: unknown) => boolean;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 30000,
};

/** Sleep for the given number of milliseconds */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async function with exponential backoff.
 *
 * @example
 * const data = await retryWithBackoff(
 *   () => fetch("https://api.example.com/data"),
 *   { maxAttempts: 3, initialDelayMs: 500, backoffMultiplier: 2, maxDelayMs: 5000 }
 * );
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>,
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === opts.maxAttempts) break;
      if (opts.isRetryable && !opts.isRetryable(err)) break;

      const delay = Math.min(
        opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelayMs,
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

/** Wrap a sync operation with standardized error handling */
export function safeRunSync<T>(
  fn: () => T,
  format?: (result: T) => string,
): ToolResult {
  try {
    const result = fn();
    if (format) return textResult(format(result));
    return textResult(String(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResult(message);
  }
}
