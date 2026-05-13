import type { PrometheusClient } from "./tools/types.js";
import { createPrometheusClient, createPrometheusTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type PrometheusConfig } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  client: PrometheusClient;
  logger: Logger;
  config: PrometheusConfig;
}

export function createServerContext(config?: Partial<PrometheusConfig>): ServerContext {
  const fullConfig = config?.url
    ? {
        url: config.url,
        username: config.username,
        password: config.password,
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({
    name: "prometheus",
    level: fullConfig.logLevel,
  });

  const auth = fullConfig.username && fullConfig.password
    ? { username: fullConfig.username, password: fullConfig.password }
    : undefined;

  const client = createPrometheusClient(fullConfig.url, auth);
  const tools = createPrometheusTools(client);
  const server = createMcpServer("@mcp-toolkit/prometheus", "0.1.0", tools, logger);

  return { server, client, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "Prometheus", ctx.config);
}
