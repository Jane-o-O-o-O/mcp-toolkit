import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const VercelConfigSchema = z.object({
  token: z.string().min(1),
  teamId: z.string().optional(),
  baseUrl: z.string().default("https://api.vercel.com"),
  ...BaseConfigFields,
});

export type VercelConfig = z.infer<typeof VercelConfigSchema>;

export function loadConfig(): VercelConfig {
  const base = parseBaseEnvVars();

  const token = process.env["VERCEL_TOKEN"];
  if (!token) {
    throw new Error("VERCEL_TOKEN environment variable is required");
  }

  return VercelConfigSchema.parse({
    ...base,
    token,
    teamId: process.env["VERCEL_TEAM_ID"] || undefined,
    baseUrl: process.env["VERCEL_BASE_URL"] || "https://api.vercel.com",
  });
}
