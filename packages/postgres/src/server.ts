import type { PostgresClient } from "./tools/types.js";
import { createPostgresTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type PostgresConfig } from "./config.js";
import { createPgClient } from "./tools/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  pg: PostgresClient;
  logger: Logger;
  config: PostgresConfig;
}

export function createServerContext(config?: Partial<PostgresConfig>): ServerContext {
  const fullConfig = config?.connectionString
    ? {
        connectionString: config.connectionString,
        maxConnections: config.maxConnections ?? 10,
        queryTimeout: config.queryTimeout ?? 30000,
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({
    name: "postgres",
    level: fullConfig.logLevel,
  });

  const pg = createPgClient(fullConfig.connectionString, fullConfig.maxConnections);
  const tools = createPostgresTools(pg);
  const server = createMcpServer("@mcp-toolkit/postgres", "0.1.0", tools, logger);

  return { server, pg, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "PostgreSQL", ctx.config);
}
