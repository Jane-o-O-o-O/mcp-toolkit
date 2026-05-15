import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const SentryConfigSchema = z.object({
  authToken: z.string().min(1),
  baseUrl: z.string().default("https://sentry.io/api/0"),
  orgSlug: z.string().min(1),
  ...BaseConfigFields,
});

export type SentryConfig = z.infer<typeof SentryConfigSchema>;

export function loadConfig(): SentryConfig {
  const base = parseBaseEnvVars();
  const authToken = process.env.SENTRY_AUTH_TOKEN;
  if (!authToken) {
    throw new Error("SENTRY_AUTH_TOKEN environment variable is required");
  }
  const orgSlug = process.env.SENTRY_ORG;
  if (!orgSlug) {
    throw new Error("SENTRY_ORG environment variable is required");
  }
  return SentryConfigSchema.parse({
    authToken,
    baseUrl: process.env.SENTRY_BASE_URL ?? "https://sentry.io/api/0",
    orgSlug,
    ...base,
  });
}
