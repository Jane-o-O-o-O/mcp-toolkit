import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const S3ConfigSchema = z.object({
  endpoint: z.string().optional(),
  region: z.string().default("us-east-1"),
  accessKeyId: z.string().min(1, "S3_ACCESS_KEY_ID is required"),
  secretAccessKey: z.string().min(1, "S3_SECRET_ACCESS_KEY is required"),
  forcePathStyle: z.boolean().default(true),
  ...BaseConfigFields,
});

export type S3Config = z.infer<typeof S3ConfigSchema>;

export function loadConfig(): S3Config {
  const base = parseBaseEnvVars();
  return S3ConfigSchema.parse({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "us-east-1",
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
    ...base,
  });
}
