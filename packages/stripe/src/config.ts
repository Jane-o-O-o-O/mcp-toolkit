import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const StripeConfigSchema = z.object({
  apiKey: z.string().min(1),
  apiVersion: z.string().default("2024-12-18.acacia"),
  baseUrl: z.string().default("https://api.stripe.com/v1"),
  ...BaseConfigFields,
});

export type StripeConfig = z.infer<typeof StripeConfigSchema>;

export function loadConfig(): StripeConfig {
  const base = parseBaseEnvVars();
  const apiKey = process.env.STRIPE_API_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_API_KEY environment variable is required");
  }
  return StripeConfigSchema.parse({
    apiKey,
    apiVersion: process.env.STRIPE_API_VERSION ?? "2024-12-18.acacia",
    baseUrl: process.env.STRIPE_BASE_URL ?? "https://api.stripe.com/v1",
    ...base,
  });
}
