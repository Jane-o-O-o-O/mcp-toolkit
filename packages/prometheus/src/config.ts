import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const PrometheusConfigSchema = z.object({
  url: z.string().url("Invalid Prometheus URL"),
  username: z.string().optional(),
  password: z.string().optional(),
  ...BaseConfigFields,
});

export type PrometheusConfig = z.infer<typeof PrometheusConfigSchema>;

export function loadConfig(): PrometheusConfig {
  const url = process.env.PROMETHEUS_URL;
  if (!url) {
    throw new Error(
      "PROMETHEUS_URL environment variable is required. Example: http://localhost:9090",
    );
  }

  const base = parseBaseEnvVars();
  return PrometheusConfigSchema.parse({
    url,
    username: process.env.PROMETHEUS_USERNAME,
    password: process.env.PROMETHEUS_PASSWORD,
    ...base,
  });
}
