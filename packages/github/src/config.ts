import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const GitHubConfigSchema = z.object({
  token: z.string().min(1, "GitHub token is required"),
  baseUrl: z.string().url().default("https://api.github.com"),
  ...BaseConfigFields,
});

export type GitHubConfig = z.infer<typeof GitHubConfigSchema>;

export function loadConfig(): GitHubConfig {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN environment variable is required. Create one at https://github.com/settings/tokens",
    );
  }

  const base = parseBaseEnvVars();
  return GitHubConfigSchema.parse({
    token,
    baseUrl: process.env.GITHUB_API_URL ?? "https://api.github.com",
    ...base,
  });
}
