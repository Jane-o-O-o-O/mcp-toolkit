import type { VercelClient } from "./tools/types.js";
import { createVercelTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type VercelConfig } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  client: VercelClient;
  logger: Logger;
  config: VercelConfig;
}

export function createServerContext(client: VercelClient, config?: Partial<VercelConfig>): ServerContext {
  const fullConfig = config?.token
    ? {
        token: config.token,
        teamId: config.teamId,
        baseUrl: config.baseUrl ?? "https://api.vercel.com",
        logLevel: config.logLevel ?? "info",
        transport: config.transport ?? "stdio",
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({ name: "vercel", level: fullConfig.logLevel });
  const tools = createVercelTools(client);
  const server = createMcpServer("@mcp-toolkit/vercel", "0.1.0", tools, logger);

  return { server, client, logger, config: fullConfig as VercelConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "Vercel", {
    transport: ctx.config.transport,
    port: ctx.config.port,
  });
}
