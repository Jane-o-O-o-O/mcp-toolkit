import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const SupabaseConfigSchema = z.object({
  projectUrl: z.string().url("Invalid Supabase project URL"),
  serviceRoleKey: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  ...BaseConfigFields,
});

export type SupabaseConfig = z.infer<typeof SupabaseConfigSchema>;

export function loadConfig(): SupabaseConfig {
  const projectUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!projectUrl) {
    throw new Error(
      "SUPABASE_URL environment variable is required. Example: https://xxx.supabase.co",
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY environment variable is required. Found in Project Settings > API",
    );
  }

  const base = parseBaseEnvVars();
  return SupabaseConfigSchema.parse({
    projectUrl,
    serviceRoleKey,
    ...base,
  });
}
