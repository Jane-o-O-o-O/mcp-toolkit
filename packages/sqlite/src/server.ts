import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { SQLiteDatabase } from "./tools/types.js";
import { createSQLiteTools } from "./tools/index.js";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type SQLiteConfig } from "./config.js";
import Database from "better-sqlite3";

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

  const server = new Server(
    { name: "@mcp-toolkit/sqlite", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  const tools = createSQLiteTools(db);

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => t.definition),
  }));

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request) => {
      const { name, arguments: args } = request.params;
      const tool = tools.find((t) => t.definition.name === name);

      if (!tool) {
        return {
          content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
          isError: true,
        } as Record<string, unknown>;
      }

      logger.debug("tool.call", { tool: name, args });
      const result = await tool.handler(args ?? {});
      logger.debug("tool.result", { tool: name, isError: result.isError ?? false });
      return result as unknown as Record<string, unknown>;
    },
  );

  return { server, db, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  const transport = new StdioServerTransport();
  await ctx.server.connect(transport);
  ctx.logger.info("SQLite MCP Server started", { transport: "stdio" });
}
