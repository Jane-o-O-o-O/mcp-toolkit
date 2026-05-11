import { z } from "zod";

export const SQLiteConfigSchema = z.object({
  dbPath: z.string().min(1, "Database path is required"),
  readonly: z.boolean().default(false),
  logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
  transport: z.enum(["stdio", "sse", "streamable-http"]).default("stdio"),
  port: z.number().int().positive().default(3000),
});

export type SQLiteConfig = z.infer<typeof SQLiteConfigSchema>;

export function loadConfig(): SQLiteConfig {
  const dbPath = process.env.SQLITE_DB_PATH;
  if (!dbPath) {
    throw new Error(
      "SQLITE_DB_PATH environment variable is required. Example: /path/to/database.db",
    );
  }

  return SQLiteConfigSchema.parse({
    dbPath,
    readonly: process.env.SQLITE_READONLY === "true",
    logLevel: process.env.MCP_LOG_LEVEL ?? "info",
    transport: process.env.MCP_TRANSPORT ?? "stdio",
    port: process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3000,
  });
}
