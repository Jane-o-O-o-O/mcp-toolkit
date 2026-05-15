import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const CloudflareConfigSchema = z.object({
  ...BaseConfigFields,
  apiToken: z
    .string()
    .min(1, "CLOUDFLARE_API_TOKEN is required")
    .describe("Cloudflare API token"),
  accountId: z
    .string()
    .min(1, "CLOUDFLARE_ACCOUNT_ID is required")
    .describe("Cloudflare account ID"),
  baseUrl: z
    .string()
    .default("https://api.cloudflare.com/client/v4")
    .describe("Cloudflare API base URL"),
});

export type CloudflareConfig = z.infer<typeof CloudflareConfigSchema>;

export function loadConfig(): CloudflareConfig {
  const base = parseBaseEnvVars();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!apiToken) {
    throw new Error(
      "CLOUDFLARE_API_TOKEN environment variable is required"
    );
  }
  if (!accountId) {
    throw new Error(
      "CLOUDFLARE_ACCOUNT_ID environment variable is required"
    );
  }

  return CloudflareConfigSchema.parse({
    ...base,
    apiToken,
    accountId,
  });
}
