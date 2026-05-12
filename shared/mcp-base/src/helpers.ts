import type { ToolResult } from "./types.js";

/**
 * Create a successful text result.
 */
export function textResult(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

/**
 * Create a JSON result — serializes the value to formatted JSON.
 */
export function jsonResult(value: unknown): ToolResult {
  return textResult(JSON.stringify(value, null, 2));
}

/**
 * Create an error result.
 */
export function errorResult(message: string): ToolResult {
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}

/**
 * Safely execute a function, catching errors and returning ToolResult.
 * Supports both sync and async functions.
 */
export async function safeRun<T>(
  fn: () => T | Promise<T>,
  format?: (value: T) => string,
): Promise<ToolResult> {
  try {
    const result = await fn();
    if (format) {
      return textResult(format(result));
    }
    if (typeof result === "string") {
      return textResult(result);
    }
    return jsonResult(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResult(message);
  }
}

/**
 * Validate that a name contains only safe characters (alphanumeric, underscores, dots).
 * Prevents SQL injection or path traversal in tool arguments.
 */
export function validateName(
  name: string,
  label: string,
): void {
  if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(name)) {
    throw new Error(
      `Invalid ${label}: '${name}'. Only alphanumeric, underscores, and dots allowed.`,
    );
  }
}
