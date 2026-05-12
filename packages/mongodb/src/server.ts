import type { MongoDBClient } from "./tools/types.js";
import { createMongoDBTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type MongoDBConfig } from "./config.js";
import { createMongoDBClient } from "./tools/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  mongo: MongoDBClient;
  logger: Logger;
  config: MongoDBConfig;
}

export async function createServerContext(config?: Partial<MongoDBConfig>): Promise<ServerContext> {
  const fullConfig = config?.connectionString
    ? {
        connectionString: config.connectionString,
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({
    name: "mongodb",
    level: fullConfig.logLevel,
  });

  const mongo = await createMongoDBClient(fullConfig.connectionString);
  const tools = createMongoDBTools(mongo);
  const server = createMcpServer("@mcp-toolkit/mongodb", "0.1.0", tools, logger);

  return { server, mongo, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "MongoDB", ctx.config);
}
