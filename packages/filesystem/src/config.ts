import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const FilesystemConfigSchema = z.object({
  rootDir: z.string().min(1, "Root directory is required"),
  allowWrite: z.boolean().default(true),
  allowDelete: z.boolean().default(false),
  maxFileSize: z.number().int().positive().default(10 * 1024 * 1024), // 10MB
  ...BaseConfigFields,
});

export type FilesystemConfig = z.infer<typeof FilesystemConfigSchema>;

export function loadConfig(): FilesystemConfig {
  const rootDir = process.env.MCP_FILESYSTEM_ROOT;
  if (!rootDir) {
    throw new Error(
      "MCP_FILESYSTEM_ROOT environment variable is required. Example: /home/user/projects",
    );
  }

  const base = parseBaseEnvVars();
  return FilesystemConfigSchema.parse({
    rootDir,
    allowWrite: process.env.MCP_FILESYSTEM_ALLOW_WRITE !== "false",
    allowDelete: process.env.MCP_FILESYSTEM_ALLOW_DELETE === "true",
    maxFileSize: process.env.MCP_FILESYSTEM_MAX_FILE_SIZE
      ? parseInt(process.env.MCP_FILESYSTEM_MAX_FILE_SIZE, 10)
      : 10 * 1024 * 1024,
    ...base,
  });
}
