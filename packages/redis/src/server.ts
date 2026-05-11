import type { RedisClient } from "./tools/types.js";
import { createRedisTools } from "./tools/index.js";
import { createMcpServer, startStdioServer } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type RedisConfig } from "./config.js";
import { Redis as IORedis } from "ioredis";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

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
  const tools = createRedisTools(redis, fullConfig.keyPrefix);
  const server = createMcpServer("@mcp-toolkit/redis", "0.1.0", tools, logger);

  return { server, redis, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startStdioServer(ctx.server, ctx.logger, "Redis");
}
