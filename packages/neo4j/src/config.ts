import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const Neo4jConfigSchema = z.object({
  url: z.string().min(1),
  user: z.string().min(1),
  password: z.string().min(1),
  database: z.string().default("neo4j"),
  ...BaseConfigFields,
});

export type Neo4jConfig = z.infer<typeof Neo4jConfigSchema>;

export function loadConfig(): Neo4jConfig {
  const base = parseBaseEnvVars();
  const url = process.env.NEO4J_URL;
  if (!url) {
    throw new Error("NEO4J_URL environment variable is required");
  }
  const user = process.env.NEO4J_USER;
  if (!user) {
    throw new Error("NEO4J_USER environment variable is required");
  }
  const password = process.env.NEO4J_PASSWORD;
  if (!password) {
    throw new Error("NEO4J_PASSWORD environment variable is required");
  }
  return Neo4jConfigSchema.parse({
    url,
    user,
    password,
    database: process.env.NEO4J_DATABASE ?? "neo4j",
    ...base,
  });
}
