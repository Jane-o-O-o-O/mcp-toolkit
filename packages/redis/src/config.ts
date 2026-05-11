import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const RedisConfigSchema = z.object({
  url: z.string().url("Invalid Redis URL").or(z.string().startsWith("redis://")),
  keyPrefix: z.string().default(""),
  ...BaseConfigFields,
});

export type RedisConfig = z.infer<typeof RedisConfigSchema>;

export function loadConfig(): RedisConfig {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error(
      "REDIS_URL environment variable is required. Example: redis://localhost:6379",
    );
  }

  const base = parseBaseEnvVars();
  return RedisConfigSchema.parse({
    url,
    keyPrefix: process.env.REDIS_KEY_PREFIX ?? "",
    ...base,
  });
}
