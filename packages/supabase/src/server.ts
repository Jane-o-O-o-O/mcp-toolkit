import type { SupabaseClient } from "./tools/types.js";
import { createSupabaseTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type SupabaseConfig } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  supabase: SupabaseClient;
  logger: Logger;
  config: SupabaseConfig;
}

interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  comment: string | null;
}

interface TableInfo {
  schemaname: string;
  tablename: string;
  tableowner: string;
}

interface BucketInfo {
  id: string;
  name: string;
  public: boolean;
  created_at: string;
  file_count?: number;
}

function createSupabaseHttpClient(config: SupabaseConfig): SupabaseClient {
  const baseUrl = config.projectUrl.replace(/\/+$/, "");
  const headers: Record<string, string> = {
    apikey: config.serviceRoleKey,
    Authorization: "Bearer " + config.serviceRoleKey,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  async function restFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(baseUrl + path, {
      ...options,
      headers: { ...headers, ...options?.headers },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error("Supabase API error " + res.status + ": " + body);
    }
    return res.json() as Promise<T>;
  }

  return {
    async executeSql(query, params) {
      const body: Record<string, unknown> = { sql_text: query };
      if (params) body.params = params;

      try {
        const res = await restFetch<Record<string, unknown>[]>(
          "/rest/v1/rpc/exec_sql",
          { method: "POST", body: JSON.stringify(body) },
        );
        const rows = Array.isArray(res) ? res : [res];
        return {
          rows,
          rowCount: rows.length,
          command: query.trim().split(" ")[0].toUpperCase(),
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error("SQL execution failed: " + message);
      }
    },

    async listTables(schema = "public") {
      const res = await restFetch<TableInfo[]>(
        "/rest/v1/pg_tables?schemaname=eq." + schema,
      );
      return res.map((t) => ({
        schema: t.schemaname,
        name: t.tablename,
        type: "table" as const,
        rowCount: null as number | null,
        comment: null as string | null,
      }));
    },

    async getTableSchema(tableName, schema = "public") {
      const res = await restFetch<TableColumn[]>(
        "/rest/v1/information_schema/columns?table_schema=eq." +
          schema +
          "&table_name=eq." +
          tableName +
          "&order=ordinal_position",
      );
      return res.map((col) => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === "YES",
        defaultValue: col.column_default,
        isPrimaryKey: false,
        comment: col.comment,
      }));
    },

    async insertRows(tableName, rows, schema = "public") {
      const tablePath = schema === "public" ? tableName : schema + "." + tableName;
      const res = await restFetch<Record<string, unknown>[]>(
        "/rest/v1/" + tablePath,
        { method: "POST", body: JSON.stringify(rows) },
      );
      return { rows: res, rowCount: res.length };
    },

    async updateRows(tableName, updates, filter, schema = "public") {
      const tablePath = schema === "public" ? tableName : schema + "." + tableName;
      const queryParams = buildFilterParams(filter);
      const res = await restFetch<Record<string, unknown>[]>(
        "/rest/v1/" + tablePath + "?" + queryParams,
        { method: "PATCH", body: JSON.stringify(updates) },
      );
      return { rows: res, rowCount: res.length };
    },

    async deleteRows(tableName, filter, schema = "public") {
      const tablePath = schema === "public" ? tableName : schema + "." + tableName;
      const queryParams = buildFilterParams(filter);
      const res = await restFetch<Record<string, unknown>[]>(
        "/rest/v1/" + tablePath + "?" + queryParams,
        { method: "DELETE" },
      );
      return { rows: res, rowCount: res.length };
    },

    async listBuckets() {
      const res = await restFetch<BucketInfo[]>("/storage/v1/bucket");
      return res.map((b) => ({
        id: b.id,
        name: b.name,
        public: b.public,
        fileCount: b.file_count ?? 0,
        createdAt: b.created_at,
      }));
    },

    async uploadFile(bucket, path, content, contentType = "text/plain") {
      const isBase64 =
        contentType.startsWith("application/") || contentType.startsWith("image/");
      const body = isBase64 ? Buffer.from(content, "base64") : content;

      const res = await fetch(baseUrl + "/storage/v1/object/" + bucket + "/" + path, {
        method: "POST",
        headers: {
          apikey: config.serviceRoleKey,
          Authorization: "Bearer " + config.serviceRoleKey,
          "Content-Type": contentType,
          "x-upsert": "true",
        },
        body,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error("Upload error " + res.status + ": " + errText);
      }
      const data = (await res.json()) as { Key: string };
      return { path, fullPath: data.Key ?? bucket + "/" + path };
    },
  };
}

function buildFilterParams(filter: Record<string, unknown>): string {
  return Object.entries(filter)
    .map(([key, value]) => {
      if (typeof value === "object" && value !== null) {
        const op = Object.keys(value)[0];
        const val = (value as Record<string, unknown>)[op];
        const pgOps: Record<string, string> = {
          like: "like",
          gte: "gte",
          lte: "lte",
          gt: "gt",
          lt: "lt",
          neq: "neq",
          eq: "eq",
        };
        const pgOp = pgOps[op] ?? "eq";
        return key + "=" + pgOp + "." + String(val);
      }
      return key + "=eq." + String(value);
    })
    .join("&");
}

export async function createServerContext(
  config?: Partial<SupabaseConfig>,
): Promise<ServerContext> {
  const fullConfig = config?.projectUrl
    ? {
        projectUrl: config.projectUrl,
        serviceRoleKey: config.serviceRoleKey ?? "",
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({
    name: "supabase",
    level: fullConfig.logLevel,
  });

  const supabase = createSupabaseHttpClient(fullConfig);
  const tools = createSupabaseTools(supabase);
  const server = createMcpServer("@mcp-toolkit/supabase", "0.1.0", tools, logger);

  return { server, supabase, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "Supabase", {
    transport: ctx.config.transport,
    port: ctx.config.port,
  });
}
