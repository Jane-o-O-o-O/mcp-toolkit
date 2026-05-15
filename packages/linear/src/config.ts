import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const LinearConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().default("https://api.linear.app/graphql"),
  ...BaseConfigFields,
});

export type LinearConfig = z.infer<typeof LinearConfigSchema>;

export function loadConfig(): LinearConfig {
  const base = parseBaseEnvVars();
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    throw new Error("LINEAR_API_KEY environment variable is required");
  }
  return LinearConfigSchema.parse({
    apiKey,
    baseUrl: process.env.LINEAR_BASE_URL ?? "https://api.linear.app/graphql",
    ...base,
  });
}
