import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const PostgresConfigSchema = z.object({
  connectionString: z.string().min(1, "PostgreSQL connection string is required"),
  maxConnections: z.number().int().positive().default(10),
  queryTimeout: z.number().int().positive().default(30000),
  ...BaseConfigFields,
});

export type PostgresConfig = z.infer<typeof PostgresConfigSchema>;

export function loadConfig(): PostgresConfig {
  const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "POSTGRES_URL or DATABASE_URL environment variable is required. Example: postgresql://user:pass@localhost:5432/dbname",
    );
  }

  const base = parseBaseEnvVars();
  return PostgresConfigSchema.parse({
    connectionString,
    maxConnections: process.env.POSTGRES_MAX_CONNECTIONS
      ? parseInt(process.env.POSTGRES_MAX_CONNECTIONS, 10)
      : 10,
    queryTimeout: process.env.POSTGRES_QUERY_TIMEOUT
      ? parseInt(process.env.POSTGRES_QUERY_TIMEOUT, 10)
      : 30000,
    ...base,
  });
}
