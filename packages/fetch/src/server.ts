import type { FetchClient } from "./tools/types.js";
import { createFetchTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type FetchConfig } from "./config.js";
import { createFetchClient } from "./tools/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  fetcher: FetchClient;
  logger: Logger;
  config: FetchConfig;
}

export function createServerContext(config?: Partial<FetchConfig>): ServerContext {
  const fullConfig = config?.defaultTimeout !== undefined
    ? {
        defaultTimeout: config.defaultTimeout,
        maxResponseSize: config.maxResponseSize ?? 1_000_000,
        defaultHeaders: config.defaultHeaders ?? {},
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({
    name: "fetch",
    level: fullConfig.logLevel,
  });

  const fetcher = createFetchClient(fullConfig.defaultHeaders);
  const tools = createFetchTools(fetcher);
  const server = createMcpServer("@mcp-toolkit/fetch", "0.1.0", tools, logger);

  return { server, fetcher, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "Fetch", ctx.config);
}
