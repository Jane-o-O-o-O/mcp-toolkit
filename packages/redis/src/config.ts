import { z } from "zod";

export const RedisConfigSchema = z.object({
  url: z.string().url("Invalid Redis URL").or(z.string().startsWith("redis://")),
  keyPrefix: z.string().default(""),
  logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
  transport: z.enum(["stdio", "sse", "streamable-http"]).default("stdio"),
  port: z.number().int().positive().default(3000),
});

export type RedisConfig = z.infer<typeof RedisConfigSchema>;

export function loadConfig(): RedisConfig {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error(
      "REDIS_URL environment variable is required. Example: redis://localhost:6379",
    );
  }

  return RedisConfigSchema.parse({
    url,
    keyPrefix: process.env.REDIS_KEY_PREFIX ?? "",
    logLevel: process.env.MCP_LOG_LEVEL ?? "info",
    transport: process.env.MCP_TRANSPORT ?? "stdio",
    port: process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3000,
  });
}
