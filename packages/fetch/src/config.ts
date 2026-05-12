import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const FetchConfigSchema = z.object({
  defaultTimeout: z.number().int().positive().default(30000),
  maxResponseSize: z.number().int().positive().default(1_000_000),
  defaultHeaders: z.record(z.string()).default({}),
  ...BaseConfigFields,
});

export type FetchConfig = z.infer<typeof FetchConfigSchema>;

export function loadConfig(): FetchConfig {
  const base = parseBaseEnvVars();

  let defaultHeaders: Record<string, string> = {};
  if (process.env.FETCH_DEFAULT_HEADERS) {
    try {
      defaultHeaders = JSON.parse(process.env.FETCH_DEFAULT_HEADERS);
    } catch {
      // ignore invalid JSON
    }
  }

  return FetchConfigSchema.parse({
    defaultTimeout: process.env.FETCH_TIMEOUT ? parseInt(process.env.FETCH_TIMEOUT, 10) : 30000,
    maxResponseSize: process.env.FETCH_MAX_SIZE ? parseInt(process.env.FETCH_MAX_SIZE, 10) : 1_000_000,
    defaultHeaders,
    ...base,
  });
}
