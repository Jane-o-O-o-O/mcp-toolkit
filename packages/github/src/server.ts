import type { GitHubClient } from "./tools/types.js";
import { createGitHubTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type GitHubConfig } from "./config.js";
import { createGitHubClient } from "./tools/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  github: GitHubClient;
  logger: Logger;
  config: GitHubConfig;
}

export function createServerContext(config?: Partial<GitHubConfig>): ServerContext {
  const fullConfig = config?.token
    ? {
        token: config.token,
        baseUrl: config.baseUrl ?? "https://api.github.com",
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({
    name: "github",
    level: fullConfig.logLevel,
  });

  const github = createGitHubClient(fullConfig.token, fullConfig.baseUrl);
  const tools = createGitHubTools(github);
  const server = createMcpServer("@mcp-toolkit/github", "0.1.0", tools, logger);

  return { server, github, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "GitHub", {
    transport: ctx.config.transport,
    port: ctx.config.port,
  });
}
