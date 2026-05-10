import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { RedisClient } from "./tools/types.js";
import { createRedisTools } from "./tools/index.js";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type RedisConfig } from "./config.js";
import { Redis as IORedis } from "ioredis";

export interface ServerContext {
  server: Server;
  redis: RedisClient;
  logger: Logger;
  config: RedisConfig;
}

export function createRedisClient(url: string): RedisClient {
  return new IORedis(url) as unknown as RedisClient;
}

export function createServerContext(config?: Partial<RedisConfig>): ServerContext {
  const fullConfig = config?.url
    ? {
        url: config.url,
        keyPrefix: config.keyPrefix ?? "",
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({
    name: "redis",
    level: fullConfig.logLevel,
  });

  const redis = createRedisClient(fullConfig.url);

  const server = new Server(
    { name: "@mcp-toolkit/redis", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  const tools = createRedisTools(redis, fullConfig.keyPrefix);

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => t.definition),
  }));

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request) => {
      const { name, arguments: args } = request.params;
      const tool = tools.find((t) => t.definition.name === name);

      if (!tool) {
        return {
          content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
          isError: true,
        } as Record<string, unknown>;
      }

      logger.debug("tool.call", { tool: name, args });
      const result = await tool.handler(args ?? {});
      logger.debug("tool.result", { tool: name, isError: result.isError ?? false });
      return result as unknown as Record<string, unknown>;
    },
  );

  return { server, redis, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  const transport = new StdioServerTransport();
  await ctx.server.connect(transport);
  ctx.logger.info("Redis MCP Server started", { transport: "stdio" });
}
