import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const VaultConfigSchema = z.object({
  token: z.string().min(1),
  baseUrl: z.string().default("http://82.157.13.190:8200"),
  engine: z.string().default("secret"),
  ...BaseConfigFields,
});

export type VaultConfig = z.infer<typeof VaultConfigSchema>;

export function loadConfig(): VaultConfig {
  const base = parseBaseEnvVars();
  const token = process.env.VAULT_TOKEN;
  if (!token) {
    throw new Error("VAULT_TOKEN environment variable is required");
  }
  return VaultConfigSchema.parse({
    token,
    baseUrl: process.env.VAULT_ADDR ?? "http://82.157.13.190:8200",
    engine: process.env.VAULT_ENGINE ?? "secret",
    ...base,
  });
}
