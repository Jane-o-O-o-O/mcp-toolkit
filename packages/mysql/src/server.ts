import type { MySQLClient } from "./tools/types.js";
import { createMySQLTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type MySQLConfig } from "./config.js";
import { createMySQLClient } from "./tools/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  mysql: MySQLClient;
  logger: Logger;
  config: MySQLConfig;
}

export async function createServerContext(config?: Partial<MySQLConfig>): Promise<ServerContext> {
  const fullConfig = config?.connectionString
    ? {
        connectionString: config.connectionString,
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({
    name: "mysql",
    level: fullConfig.logLevel,
  });

  const mysql = await createMySQLClient(fullConfig.connectionString);
  const tools = createMySQLTools(mysql);
  const server = createMcpServer("@mcp-toolkit/mysql", "0.1.0", tools, logger);

  return { server, mysql, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "MySQL", ctx.config);
}
