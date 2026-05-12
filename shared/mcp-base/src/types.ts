/**
 * MCP Tool definition — common interface shared by all servers.
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Result returned by a tool handler.
 */
export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

/**
 * A complete MCP tool: definition + handler.
 */
export interface McpTool {
  definition: ToolDefinition;
  handler: (args: Record<string, unknown>) => Promise<ToolResult>;
}
