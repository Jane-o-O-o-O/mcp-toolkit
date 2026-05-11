import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const SQLiteConfigSchema = z.object({
  dbPath: z.string().min(1, "Database path is required"),
  readonly: z.boolean().default(false),
  ...BaseConfigFields,
});

export type SQLiteConfig = z.infer<typeof SQLiteConfigSchema>;

export function loadConfig(): SQLiteConfig {
  const dbPath = process.env.SQLITE_DB_PATH;
  if (!dbPath) {
    throw new Error(
      "SQLITE_DB_PATH environment variable is required. Example: /path/to/database.db",
    );
  }

  const base = parseBaseEnvVars();
  return SQLiteConfigSchema.parse({
    dbPath,
    readonly: process.env.SQLITE_READONLY === "true",
    ...base,
  });
}
