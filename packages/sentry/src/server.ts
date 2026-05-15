import type { SentryClient } from "./tools/types.js";
import { createSentryTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type SentryConfig } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  sentry: SentryClient;
  logger: Logger;
  config: SentryConfig;
}

function createSentryClient(config: SentryConfig): SentryClient {
  const { authToken, baseUrl, orgSlug } = config;

  async function sentryRequest<T>(method: string, path: string, body?: Record<string, unknown>): Promise<T> {
    const url = `${baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    };

    const options: RequestInit = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Sentry API error (${response.status}): ${errorBody}`);
    }
    return response.json() as Promise<T>;
  }

  return {
    async listProjects() {
      return sentryRequest("GET", `/organizations/${orgSlug}/projects/`);
    },

    async getProject(projectSlug: string) {
      return sentryRequest("GET", `/projects/${orgSlug}/${projectSlug}/`);
    },

    async listIssues(params) {
      const query = new URLSearchParams();
      if (params?.projectSlug) query.set("project", params.projectSlug);
      if (params?.query) query.set("query", params.query);
      if (params?.limit) query.set("limit", String(params.limit));
      const qs = query.toString();
      return sentryRequest("GET", `/organizations/${orgSlug}/issues/${qs ? `?${qs}` : ""}`);
    },

    async getIssue(issueId: string) {
      return sentryRequest("GET", `/issues/${issueId}/`);
    },

    async resolveIssue(issueId: string) {
      return sentryRequest("PUT", `/issues/${issueId}/`, { status: "resolved" });
    },

    async listEvents(projectSlug: string, params) {
      const query = new URLSearchParams();
      if (params?.query) query.set("query", params.query);
      if (params?.limit) query.set("limit", String(params.limit));
      const qs = query.toString();
      return sentryRequest("GET", `/projects/${orgSlug}/${projectSlug}/events/${qs ? `?${qs}` : ""}`);
    },

    async listReleases(projectSlug: string, params) {
      const query = new URLSearchParams();
      if (params?.limit) query.set("per_page", String(params.limit));
      const qs = query.toString();
      return sentryRequest("GET", `/projects/${orgSlug}/${projectSlug}/releases/${qs ? `?${qs}` : ""}`);
    },

    async createRelease(data) {
      return sentryRequest("POST", `/organizations/${orgSlug}/releases/`, data);
    },
  };
}

export async function createServerContext(config?: Partial<SentryConfig>): Promise<ServerContext> {
  const fullConfig = config?.authToken
    ? {
        authToken: config.authToken,
        baseUrl: config.baseUrl ?? "https://sentry.io/api/0",
        orgSlug: config.orgSlug ?? "default",
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({ name: "sentry", level: fullConfig.logLevel });
  const sentry = createSentryClient(fullConfig);
  const tools = createSentryTools(sentry);
  const server = createMcpServer("@mcp-toolkit/sentry", "0.1.0", tools, logger);

  return { server, sentry, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "Sentry", {
    transport: ctx.config.transport,
    port: ctx.config.port,
  });
}
