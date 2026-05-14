import type { SupabaseClient } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createSupabaseTools(supabase: SupabaseClient): McpTool[] {
  const executeSqlTool: McpTool = {
    definition: {
      name: "execute_sql",
      description:
        "Execute a raw SQL query on the Supabase PostgreSQL database. Supports SELECT, INSERT, UPDATE, DELETE, and DDL.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "SQL query to execute" },
          params: {
            type: "array",
            description: "Query parameters for parameterized queries ($1, $2, ...)",
          },
        },
        required: ["query"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () =>
          await supabase.executeSql(
            args.query as string,
            args.params as unknown[] | undefined,
          ),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const listTablesTool: McpTool = {
    definition: {
      name: "list_tables",
      description:
        "List all tables in the database with schema, type, and row count.",
      inputSchema: {
        type: "object",
        properties: {
          schema: {
            type: "string",
            description: "Database schema (default: public)",
          },
        },
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => await supabase.listTables(args.schema as string | undefined),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const getTableSchemaTool: McpTool = {
    definition: {
      name: "get_table_schema",
      description:
        "Get column definitions for a table including types, nullability, defaults, and primary keys.",
      inputSchema: {
        type: "object",
        properties: {
          table_name: { type: "string", description: "Table name" },
          schema: {
            type: "string",
            description: "Database schema (default: public)",
          },
        },
        required: ["table_name"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () =>
          await supabase.getTableSchema(
            args.table_name as string,
            args.schema as string | undefined,
          ),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const insertRowsTool: McpTool = {
    definition: {
      name: "insert_rows",
      description: "Insert one or more rows into a table. Returns the inserted rows.",
      inputSchema: {
        type: "object",
        properties: {
          table_name: { type: "string", description: "Table name" },
          rows: { type: "array", description: "Array of row objects to insert" },
          schema: {
            type: "string",
            description: "Database schema (default: public)",
          },
        },
        required: ["table_name", "rows"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () =>
          await supabase.insertRows(
            args.table_name as string,
            args.rows as Record<string, unknown>[],
            args.schema as string | undefined,
          ),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const updateRowsTool: McpTool = {
    definition: {
      name: "update_rows",
      description:
        "Update rows in a table matching a filter. Returns updated rows.",
      inputSchema: {
        type: "object",
        properties: {
          table_name: { type: "string", description: "Table name" },
          updates: { type: "object", description: "Column values to update" },
          filter: {
            type: "object",
            description:
              "Filter conditions as key-value pairs (e.g. {id: 1} or {status: {neq: draft}})",
          },
          schema: {
            type: "string",
            description: "Database schema (default: public)",
          },
        },
        required: ["table_name", "updates", "filter"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () =>
          await supabase.updateRows(
            args.table_name as string,
            args.updates as Record<string, unknown>,
            args.filter as Record<string, unknown>,
            args.schema as string | undefined,
          ),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const deleteRowsTool: McpTool = {
    definition: {
      name: "delete_rows",
      description: "Delete rows from a table matching a filter. Use with caution!",
      inputSchema: {
        type: "object",
        properties: {
          table_name: { type: "string", description: "Table name" },
          filter: {
            type: "object",
            description: "Filter conditions (e.g. {id: 1})",
          },
          schema: {
            type: "string",
            description: "Database schema (default: public)",
          },
        },
        required: ["table_name", "filter"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () =>
          await supabase.deleteRows(
            args.table_name as string,
            args.filter as Record<string, unknown>,
            args.schema as string | undefined,
          ),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const listBucketsTool: McpTool = {
    definition: {
      name: "list_buckets",
      description:
        "List all Supabase Storage buckets with file count and visibility.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () => {
      return safeRun(
        async () => await supabase.listBuckets(),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const uploadFileTool: McpTool = {
    definition: {
      name: "upload_file",
      description:
        "Upload a file to a Supabase Storage bucket. Content should be base64 encoded for binary files.",
      inputSchema: {
        type: "object",
        properties: {
          bucket: { type: "string", description: "Storage bucket name" },
          path: { type: "string", description: "File path within the bucket" },
          content: {
            type: "string",
            description: "File content (text or base64 encoded)",
          },
          content_type: {
            type: "string",
            description: "MIME type (default: text/plain)",
          },
        },
        required: ["bucket", "path", "content"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () =>
          await supabase.uploadFile(
            args.bucket as string,
            args.path as string,
            args.content as string,
            args.content_type as string | undefined,
          ),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  return [
    executeSqlTool,
    listTablesTool,
    getTableSchemaTool,
    insertRowsTool,
    updateRowsTool,
    deleteRowsTool,
    listBucketsTool,
    uploadFileTool,
  ];
}
