import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const MySQLConfigSchema = z.object({
  connectionString: z.string().min(1, "MySQL connection string is required"),
  ...BaseConfigFields,
});

export type MySQLConfig = z.infer<typeof MySQLConfigSchema>;

export function loadConfig(): MySQLConfig {
  const connectionString = process.env.MYSQL_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "MYSQL_URL or DATABASE_URL environment variable is required. Example: mysql://user:password@localhost:3306/dbname",
    );
  }

  const base = parseBaseEnvVars();
  return MySQLConfigSchema.parse({
    connectionString,
    ...base,
  });
}
