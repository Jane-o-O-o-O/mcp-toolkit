import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const MongoDBConfigSchema = z.object({
  connectionString: z.string().min(1, "MongoDB connection string is required"),
  ...BaseConfigFields,
});

export type MongoDBConfig = z.infer<typeof MongoDBConfigSchema>;

export function loadConfig(): MongoDBConfig {
  const connectionString = process.env.MONGODB_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "MONGODB_URL or DATABASE_URL environment variable is required. Example: mongodb://user:password@localhost:27017/mydb",
    );
  }

  const base = parseBaseEnvVars();
  return MongoDBConfigSchema.parse({
    connectionString,
    ...base,
  });
}
