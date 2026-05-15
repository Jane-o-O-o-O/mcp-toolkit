import type { CloudflareClient } from "./tools/types.js";
import { createCloudflareTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type CloudflareConfig } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  client: CloudflareClient;
  logger: Logger;
  config: CloudflareConfig;
}

export function createServerContext(client: CloudflareClient, config?: Partial<CloudflareConfig>): ServerContext {
  const fullConfig = config?.apiToken
    ? {
        apiToken: config.apiToken,
        accountId: config.accountId ?? "test",
        baseUrl: config.baseUrl ?? "https://api.cloudflare.com/client/v4",
        logLevel: config.logLevel ?? "info",
        transport: config.transport ?? "stdio",
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({ name: "cloudflare", level: fullConfig.logLevel });
  const tools = createCloudflareTools(client);
  const server = createMcpServer("@mcp-toolkit/cloudflare", "0.1.0", tools, logger);

  return { server, client, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "Cloudflare", {
    transport: ctx.config.transport,
    port: ctx.config.port,
  });
}
