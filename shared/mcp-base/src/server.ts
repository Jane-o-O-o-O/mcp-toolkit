import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { McpTool } from "./types.js";
import type { Logger } from "@mcp-toolkit/logger";

/**
 * Base configuration shared by all MCP servers.
 */
export interface BaseConfig {
  logLevel: "debug" | "info" | "warn" | "error";
  transport: "stdio" | "sse" | "streamable-http";
  port: number;
}

/**
 * Options for creating a server context.
 */
export interface CreateServerOptions {
  name: string;
  version: string;
  tools: McpTool[];
  logger: Logger;
}

/**
 * A generic server context — not tied to any specific service.
 */
export interface ServerContext {
  server: Server;
  logger: Logger;
}

/**
 * Create an MCP server with the given tools and logger.
 * This is the shared factory that all servers use, eliminating
 * duplicate ListTools/CallTool handler setup.
 */
export function createServer(options: CreateServerOptions): ServerContext {
  const { name, version, tools, logger } = options;

  const server = new Server(
    { name, version },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => t.definition),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name: toolName, arguments: args } = request.params;
    const tool = tools.find((t) => t.definition.name === toolName);

    if (!tool) {
      return {
        content: [{ type: "text" as const, text: `Unknown tool: ${toolName}` }],
        isError: true,
      } as Record<string, unknown>;
    }

    logger.debug("tool.call", { tool: toolName, args });
    const result = await tool.handler(args ?? {});
    logger.debug("tool.result", {
      tool: toolName,
      isError: result.isError ?? false,
    });
    return result as unknown as Record<string, unknown>;
  });

  return { server, logger };
}

/**
 * Start the server with stdio transport.
 */
export async function startServer(ctx: ServerContext): Promise<void> {
  const transport = new StdioServerTransport();
  await ctx.server.connect(transport);
  ctx.logger.info("MCP Server started", { transport: "stdio" });
}
