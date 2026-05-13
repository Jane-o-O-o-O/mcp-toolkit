import type { ElasticsearchClient } from "./tools/types.js";
import { createElasticsearchTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type ElasticsearchConfig } from "./config.js";
import { Client } from "@elastic/elasticsearch";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  es: ElasticsearchClient;
  logger: Logger;
  config: ElasticsearchConfig;
}

export function createElasticsearchClient(config: ElasticsearchConfig): ElasticsearchClient {
  const clientOpts: Record<string, unknown> = { node: config.url };

  if (config.apiKey) {
    clientOpts.auth = { apiKey: config.apiKey };
  } else if (config.username && config.password) {
    clientOpts.auth = { username: config.username, password: config.password };
  }

  return new Client(clientOpts) as unknown as ElasticsearchClient;
}

export function createServerContext(config?: Partial<ElasticsearchConfig>): ServerContext {
  const fullConfig = config?.url
    ? {
        url: config.url,
        apiKey: config.apiKey,
        username: config.username,
        password: config.password,
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({
    name: "elasticsearch",
    level: fullConfig.logLevel,
  });

  const es = createElasticsearchClient(fullConfig);
  const tools = createElasticsearchTools(es);
  const server = createMcpServer("@mcp-toolkit/elasticsearch", "0.1.0", tools, logger);

  return { server, es, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "Elasticsearch", ctx.config);
}
