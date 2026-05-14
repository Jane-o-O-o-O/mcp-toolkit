import type { GrafanaClient } from "./tools/types.js";
import { createGrafanaTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type GrafanaConfig } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  grafana: GrafanaClient;
  logger: Logger;
  config: GrafanaConfig;
}

function getAuthHeaders(config: GrafanaConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  } else if (config.username && config.password) {
    const encoded = Buffer.from(`${config.username}:${config.password}`).toString("base64");
    headers["Authorization"] = `Basic ${encoded}`;
  }
  return headers;
}

/** Create a Grafana client using native fetch */
function createGrafanaHttpClient(config: GrafanaConfig): GrafanaClient {
  const baseUrl = config.url.replace(/\/+$/, "");
  const headers = getAuthHeaders(config);

  async function grafanaFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${baseUrl}/api${path}`, {
      ...options,
      headers: { ...headers, ...options?.headers },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Grafana API error ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  }

  return {
    async listDashboards() {
      const results = await grafanaFetch<Array<{
        uid: string; title: string; url: string; tags: string[];
        folderTitle?: string; updated?: string;
      }>>("/search?type=dash-db");
      return results.map((r) => ({
        uid: r.uid,
        title: r.title,
        url: r.url,
        tags: r.tags ?? [],
        folderTitle: r.folderTitle ?? "General",
        updated: r.updated ?? "",
      }));
    },

    async getDashboard(uid: string) {
      const res = await grafanaFetch<{
        dashboard: {
          uid: string; title: string; tags: string[];
          panels?: Array<{ id: number; title: string; type: string }>;
          templating?: { list?: Array<{ name: string; type: string }> };
          time?: { from: string; to: string };
          version: number;
        };
      }>(`/dashboards/uid/${uid}`);
      const d = res.dashboard;
      return {
        uid: d.uid,
        title: d.title,
        tags: d.tags ?? [],
        panels: (d.panels ?? []).map((p) => ({ id: p.id, title: p.title, type: p.type })),
        templating: (d.templating?.list ?? []).map((t) => ({ name: t.name, type: t.type })),
        time: d.time ?? { from: "now-6h", to: "now" },
        version: d.version,
      };
    },

    async createDashboard(request) {
      const res = await grafanaFetch<{ uid: string; url: string; version: number; status: string }>(
        "/dashboards/db",
        {
          method: "POST",
          body: JSON.stringify(request),
        },
      );
      return res;
    },

    async listDatasources() {
      const results = await grafanaFetch<Array<{
        id: number; uid: string; name: string; type: string;
        url: string; isDefault: boolean;
      }>>("/datasources");
      return results.map((ds) => ({
        id: ds.id,
        uid: ds.uid,
        name: ds.name,
        type: ds.type,
        url: ds.url,
        isDefault: ds.isDefault,
      }));
    },

    async queryDatasource(datasourceId: number, query: string, from?: string, to?: string) {
      const now = Date.now();
      const res = await grafanaFetch<Record<string, unknown>>("/ds/query", {
        method: "POST",
        body: JSON.stringify({
          queries: [{
            refId: "A",
            datasource: { type: "prometheus", uid: `ds-${datasourceId}` },
            expr: query,
          }],
          from: from ?? String(now - 3600000),
          to: to ?? String(now),
        }),
      });
      return { results: (res.results as Array<{ series?: Array<{ name: string; columns: string[]; values: unknown[][] }> }>) ?? [] };
    },

    async listAlertRules() {
      const results = await grafanaFetch<Array<{
        uid: string; title: string; state?: string;
        folderUID?: string; updated?: string; condition?: string;
      }>>("/ruler/grafana/api/v1/rules");
      return results.map((r) => ({
        uid: r.uid,
        title: r.title,
        state: r.state ?? "unknown",
        folderUid: r.folderUID ?? "",
        updated: r.updated ?? "",
        condition: r.condition ?? "",
      }));
    },

    async createAnnotation(text, tags?, dashboardUid?, time?, timeEnd?) {
      const res = await grafanaFetch<{ id: number; message: string }>("/annotations", {
        method: "POST",
        body: JSON.stringify({
          text,
          tags: tags ?? [],
          dashboardUid,
          time: time ?? Date.now(),
          timeEnd,
        }),
      });
      return { id: res.id, message: text };
    },

    async search(query, type?) {
      const params = new URLSearchParams({ query });
      if (type) params.set("type", type);
      const results = await grafanaFetch<Array<{
        uid: string; title: string; url: string; type: string; tags: string[];
      }>>(`/search?${params}`);
      return results.map((r) => ({
        uid: r.uid,
        title: r.title,
        url: r.url,
        type: r.type,
        tags: r.tags ?? [],
      }));
    },
  };
}

export async function createServerContext(config?: Partial<GrafanaConfig>): Promise<ServerContext> {
  const fullConfig = config?.url
    ? {
        url: config.url,
        apiKey: config.apiKey,
        username: config.username,
        password: config.password,
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({
    name: "grafana",
    level: fullConfig.logLevel,
  });

  const grafana = createGrafanaHttpClient(fullConfig);
  const tools = createGrafanaTools(grafana);
  const server = createMcpServer("@mcp-toolkit/grafana", "0.1.0", tools, logger);

  return { server, grafana, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "Grafana", {
    transport: ctx.config.transport,
    port: ctx.config.port,
  });
}
