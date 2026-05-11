import type { SQLiteDatabase } from "./tools/types.js";
import { createSQLiteTools } from "./tools/index.js";
import { createMcpServer, startStdioServer } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type SQLiteConfig } from "./config.js";
import Database from "better-sqlite3";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  db: SQLiteDatabase;
  logger: Logger;
  config: SQLiteConfig;
}

export function createSQLiteDatabase(path: string, readonly: boolean): SQLiteDatabase {
  return new Database(path, { readonly }) as unknown as SQLiteDatabase;
}

export function createServerContext(config?: Partial<SQLiteConfig>): ServerContext {
  const fullConfig = config?.dbPath
    ? {
        dbPath: config.dbPath,
        readonly: config.readonly ?? false,
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({
    name: "sqlite",
    level: fullConfig.logLevel,
  });

  const db = createSQLiteDatabase(fullConfig.dbPath, fullConfig.readonly);
  const tools = createSQLiteTools(db);
  const server = createMcpServer("@mcp-toolkit/sqlite", "0.1.0", tools, logger);

  return { server, db, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startStdioServer(ctx.server, ctx.logger, "SQLite");
}
