import type { VaultClient } from "./tools/types.js";
import { createVaultTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type VaultConfig } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  vault: VaultClient;
  logger: Logger;
  config: VaultConfig;
}

function createVaultClient(config: VaultConfig): VaultClient {
  const { token, baseUrl, engine } = config;

  async function vaultRequest<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = `${baseUrl}${path}`;
    const headers: Record<string, string> = {
      "X-Vault-Token": token,
      "Content-Type": "application/json",
    };

    const options: RequestInit = { method, headers };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (method === "DELETE" && response.status === 204) {
      return undefined as T;
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Vault API error (${response.status}): ${errorBody}`);
    }
    return response.json() as Promise<T>;
  }

  return {
    async readSecret(path: string) {
      return vaultRequest("GET", `/v1/${engine}/data/${path}`);
    },

    async writeSecret(path: string, data: Record<string, unknown>) {
      return vaultRequest("POST", `/v1/${engine}/data/${path}`, { data });
    },

    async deleteSecret(path: string) {
      await vaultRequest("DELETE", `/v1/${engine}/data/${path}`);
    },

    async listSecrets(path: string) {
      const query = path ? `?list=true` : `?list=true`;
      return vaultRequest("LIST", `/v1/${engine}/metadata/${path}${query}`);
    },

    async readSecretMetadata(path: string) {
      return vaultRequest("GET", `/v1/${engine}/metadata/${path}`);
    },

    async listPolicies() {
      return vaultRequest("GET", "/v1/sys/policies/acl");
    },

    async readPolicy(name: string) {
      return vaultRequest("GET", `/v1/sys/policies/acl/${name}`);
    },

    async getHealth() {
      return vaultRequest("GET", "/v1/sys/health");
    },
  };
}

export async function createServerContext(config?: Partial<VaultConfig>): Promise<ServerContext> {
  const fullConfig = config?.token
    ? {
        token: config.token,
        baseUrl: config.baseUrl ?? "http://82.157.13.190:8200",
        engine: config.engine ?? "secret",
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({ name: "vault", level: fullConfig.logLevel });
  const vault = createVaultClient(fullConfig);
  const tools = createVaultTools(vault);
  const server = createMcpServer("@mcp-toolkit/vault", "0.1.0", tools, logger);

  return { server, vault, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "Vault", {
    transport: ctx.config.transport,
    port: ctx.config.port,
  });
}
