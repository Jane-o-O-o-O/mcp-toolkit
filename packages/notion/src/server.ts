import type { NotionClient } from "./tools/types.js";
import { createNotionTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type NotionConfig } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  notion: NotionClient;
  logger: Logger;
  config: NotionConfig;
}

const NOTION_API_BASE = "https://api.notion.com/v1";

interface NotionSearchResult {
  object: string;
  id: string;
  url: string;
  last_edited_time: string;
  properties?: Record<string, unknown>;
}

interface NotionPageResult {
  id: string;
  url: string;
  created_time: string;
  last_edited_time: string;
  properties?: Record<string, unknown>;
}

interface NotionDatabaseResult {
  id: string;
  url: string;
  title: Array<{ plain_text: string }>;
  properties: Record<string, { type: string }>;
}

interface NotionBlock {
  object: string;
  type: string;
  [key: string]: unknown;
}

function createNotionHttpClient(config: NotionConfig): NotionClient {
  const headers: Record<string, string> = {
    Authorization: "Bearer " + config.apiKey,
    "Notion-Version": config.notionVersion,
    "Content-Type": "application/json",
  };

  async function notionFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(NOTION_API_BASE + path, {
      ...options,
      headers: { ...headers, ...options?.headers },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error("Notion API error " + res.status + ": " + body);
    }
    return res.json() as Promise<T>;
  }

  return {
    async search(query, filter) {
      const body: Record<string, unknown> = { query };
      if (filter) body.filter = filter;
      const res = await notionFetch<{ results: NotionSearchResult[] }>(
        "/search",
        { method: "POST", body: JSON.stringify(body) },
      );
      return res.results.map((r) => ({
        object: r.object,
        id: r.id,
        title: extractTitle(r.properties),
        url: r.url,
        lastEditedTime: r.last_edited_time,
      }));
    },

    async listPages(databaseId, filter, sorts) {
      const body: Record<string, unknown> = {};
      if (filter) body.filter = filter;
      if (sorts) body.sorts = sorts;
      const res = await notionFetch<{ results: NotionPageResult[] }>(
        "/databases/" + databaseId + "/query",
        { method: "POST", body: JSON.stringify(body) },
      );
      return res.results.map((p) => ({
        id: p.id,
        title: extractTitle(p.properties),
        url: p.url,
        createdTime: p.created_time,
        lastEditedTime: p.last_edited_time,
      }));
    },

    async getPage(pageId) {
      const res = await notionFetch<NotionPageResult>("/pages/" + pageId);
      return {
        id: res.id,
        title: extractTitle(res.properties),
        url: res.url,
        properties: res.properties ?? {},
        createdTime: res.created_time,
        lastEditedTime: res.last_edited_time,
      };
    },

    async createPage(parent, properties, children) {
      const body: Record<string, unknown> = { parent, properties };
      if (children) body.children = children;
      const res = await notionFetch<NotionPageResult>("/pages", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return {
        id: res.id,
        url: res.url,
        createdTime: res.created_time,
        lastEditedTime: res.last_edited_time,
      };
    },

    async updatePage(pageId, properties) {
      const res = await notionFetch<NotionPageResult>("/pages/" + pageId, {
        method: "PATCH",
        body: JSON.stringify({ properties }),
      });
      return {
        id: res.id,
        url: res.url,
        lastEditedTime: res.last_edited_time,
      };
    },

    async getDatabase(databaseId) {
      const res = await notionFetch<NotionDatabaseResult>("/databases/" + databaseId);
      return {
        id: res.id,
        title: res.title.map((t) => t.plain_text).join(""),
        properties: res.properties,
        url: res.url,
      };
    },

    async queryDatabase(databaseId, filter, sorts, pageSize) {
      const body: Record<string, unknown> = {};
      if (filter) body.filter = filter;
      if (sorts) body.sorts = sorts;
      if (pageSize) body.page_size = pageSize;
      const res = await notionFetch<{
        results: NotionPageResult[];
        has_more: boolean;
        next_cursor: string | null;
      }>("/databases/" + databaseId + "/query", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return {
        pages: res.results.map((p) => ({
          id: p.id,
          title: extractTitle(p.properties),
          url: p.url,
          createdTime: p.created_time,
          lastEditedTime: p.last_edited_time,
        })),
        hasMore: res.has_more,
        nextCursor: res.next_cursor,
      };
    },

    async getBlockChildren(blockId, pageSize) {
      const params = pageSize ? "?page_size=" + pageSize : "";
      const res = await notionFetch<{
        results: NotionBlock[];
        has_more: boolean;
        next_cursor: string | null;
      }>("/blocks/" + blockId + "/children" + params);
      return {
        blocks: res.results.map((b) => ({ ...b })),
        hasMore: res.has_more,
        nextCursor: res.next_cursor,
      };
    },

    async appendBlockChildren(blockId, children) {
      await notionFetch<unknown>("/blocks/" + blockId + "/children", {
        method: "PATCH",
        body: JSON.stringify({ children }),
      });
      return { blockCount: children.length };
    },
  };
}

function extractTitle(properties?: Record<string, unknown>): string {
  if (!properties) return "Untitled";
  for (const val of Object.values(properties)) {
    const prop = val as Record<string, unknown>;
    if (prop.type === "title" && Array.isArray(prop.title)) {
      return (prop.title as Array<{ plain_text: string }>).map((t) => t.plain_text).join("");
    }
  }
  return "Untitled";
}

export async function createServerContext(config?: Partial<NotionConfig>): Promise<ServerContext> {
  const fullConfig = config?.apiKey
    ? {
        apiKey: config.apiKey,
        notionVersion: config.notionVersion ?? "2022-06-28",
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({
    name: "notion",
    level: fullConfig.logLevel,
  });

  const notion = createNotionHttpClient(fullConfig);
  const tools = createNotionTools(notion);
  const server = createMcpServer("@mcp-toolkit/notion", "0.1.0", tools, logger);

  return { server, notion, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "Notion", {
    transport: ctx.config.transport,
    port: ctx.config.port,
  });
}
