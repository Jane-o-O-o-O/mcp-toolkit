import { z } from "zod";

export const FilesystemConfigSchema = z.object({
  allowedPaths: z
    .array(z.string().min(1))
    .min(1, "At least one allowed path is required"),
  logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
  transport: z.enum(["stdio", "sse", "streamable-http"]).default("stdio"),
  port: z.number().int().positive().default(3000),
  maxFileSize: z.number().int().positive().default(10 * 1024 * 1024), // 10MB default
});

export type FilesystemConfig = z.infer<typeof FilesystemConfigSchema>;

export function loadConfig(): FilesystemConfig {
  const paths = process.env.FILESYSTEM_ALLOWED_PATHS;
  if (!paths) {
    throw new Error(
      "FILESYSTEM_ALLOWED_PATHS environment variable is required. Comma-separated list of allowed directory paths. Example: /home/user/projects,/tmp/workspace",
    );
  }

  return FilesystemConfigSchema.parse({
    allowedPaths: paths.split(",").map((p) => p.trim()),
    logLevel: process.env.MCP_LOG_LEVEL ?? "info",
    transport: process.env.MCP_TRANSPORT ?? "stdio",
    port: process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3000,
    maxFileSize: process.env.FILESYSTEM_MAX_FILE_SIZE
      ? parseInt(process.env.FILESYSTEM_MAX_FILE_SIZE, 10)
      : 10 * 1024 * 1024,
  });
}
