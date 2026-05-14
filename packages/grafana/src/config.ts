import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const GrafanaConfigSchema = z.object({
  url: z.string().url(),
  apiKey: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  ...BaseConfigFields,
});

export type GrafanaConfig = z.infer<typeof GrafanaConfigSchema>;

export function loadConfig(): GrafanaConfig {
  const base = parseBaseEnvVars();
  return GrafanaConfigSchema.parse({
    url: process.env.GRAFANA_URL ?? "http://localhost:3000",
    apiKey: process.env.GRAFANA_API_KEY,
    username: process.env.GRAFANA_USERNAME,
    password: process.env.GRAFANA_PASSWORD,
    ...base,
  });
}
