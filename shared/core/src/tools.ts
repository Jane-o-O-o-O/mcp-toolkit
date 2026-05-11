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
