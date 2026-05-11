import { createFilesystemTools } from "./tools/index.js";
import { createMcpServer, startStdioServer } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type FilesystemConfig } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  logger: Logger;
  config: FilesystemConfig;
}

export function createServerContext(config?: Partial<FilesystemConfig>): ServerContext {
  const fullConfig = config?.rootDir
    ? {
        rootDir: config.rootDir,
        allowWrite: config.allowWrite ?? true,
        allowDelete: config.allowDelete ?? false,
        maxFileSize: config.maxFileSize ?? 10 * 1024 * 1024,
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({
    name: "filesystem",
    level: fullConfig.logLevel,
  });

  const tools = createFilesystemTools(fullConfig.rootDir, {
    allowWrite: fullConfig.allowWrite,
    allowDelete: fullConfig.allowDelete,
    maxFileSize: fullConfig.maxFileSize,
  });

  const server = createMcpServer("@mcp-toolkit/filesystem", "0.1.0", tools, logger);

  return { server, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startStdioServer(ctx.server, ctx.logger, "Filesystem");
}
