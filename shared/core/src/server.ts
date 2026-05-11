import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { McpTool } from "./tools.js";
import type { Logger } from "@mcp-toolkit/logger";

/** Create an MCP server with tools auto-registered */
export function createMcpServer(
  name: string,
  version: string,
  tools: McpTool[],
  logger: Logger,
): Server {
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
      };
    }

    logger.debug("tool.call", { tool: toolName, args });
    const result = await tool.handler(args ?? {});
    logger.debug("tool.result", { tool: toolName, isError: result.isError ?? false });
    return result as unknown as Record<string, unknown>;
  });

  return server;
}

/** Start the server with stdio transport */
export async function startStdioServer(
  server: Server,
  logger: Logger,
  serverName: string,
): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info(`${serverName} MCP Server started`, { transport: "stdio" });
}
