import { z } from "zod";

/** Common config fields shared by all MCP Toolkit servers */
export interface BaseServerConfig {
  logLevel: "debug" | "info" | "warn" | "error";
  transport: "stdio" | "sse" | "streamable-http";
  port: number;
}

/** Zod schema for common config fields */
export const BaseConfigFields = {
  logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
  transport: z.enum(["stdio", "sse", "streamable-http"]).default("stdio"),
  port: z.number().int().positive().default(3000),
};

/** Parse common env vars into base config fields */
export function parseBaseEnvVars(): Partial<BaseServerConfig> {
  return {
    logLevel: (process.env.MCP_LOG_LEVEL ?? "info") as BaseServerConfig["logLevel"],
    transport: (process.env.MCP_TRANSPORT ?? "stdio") as BaseServerConfig["transport"],
    port: process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3000,
  };
}
