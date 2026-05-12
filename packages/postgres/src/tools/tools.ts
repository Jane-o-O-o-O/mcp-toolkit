import type { PostgresClient } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createPostgresTools(pg: PostgresClient): McpTool[] {
  const queryTool: McpTool = {
    definition: {
      name: "query",
      description: "Execute a read-only SQL query and return results as JSON. Use for SELECT statements.",
      inputSchema: {
        type: "object",
        properties: {
          sql: { type: "string", description: "SQL SELECT query to execute" },
          params: {
            type: "array",
            items: { type: "string" },
            description: "Query parameters ($1, $2, etc.)",
          },
        },
        required: ["sql"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const result = await pg.query(
            args.sql as string,
            args.params as unknown[] | undefined,
          );
          return { rows: result.rowCount, data: result.rows };
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const executeTool: McpTool = {
    definition: {
      name: "execute",
      description: "Execute a write SQL statement (INSERT, UPDATE, DELETE, CREATE, ALTER). Returns affected row count.",
      inputSchema: {
        type: "object",
        properties: {
          sql: { type: "string", description: "SQL statement to execute" },
          params: {
            type: "array",
            items: { type: "string" },
            description: "Statement parameters ($1, $2, etc.)",
          },
        },
        required: ["sql"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const result = await pg.query(
            args.sql as string,
            args.params as unknown[] | undefined,
          );
          return { rowCount: result.rowCount, command: result.command };
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const listTablesTool: McpTool = {
    definition: {
      name: "list_tables",
      description: "List all tables in the database (schema, name, type, row estimate).",
      inputSchema: {
        type: "object",
        properties: {
          schema: {
            type: "string",
            description: "Schema to list tables from (default: public)",
          },
        },
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const schema = (args.schema as string) ?? "public";
          const result = await pg.query(
            `SELECT schemaname, tablename, tableowner
             FROM pg_tables
             WHERE schemaname = $1
             ORDER BY tablename`,
            [schema],
          );
          return result.rows;
        },
        (rows) => JSON.stringify(rows, null, 2),
      );
    },
  };

  const describeTableTool: McpTool = {
    definition: {
      name: "describe_table",
      description: "Get detailed column information for a table (name, type, nullable, default, constraints).",
      inputSchema: {
        type: "object",
        properties: {
          table: { type: "string", description: "Table name" },
          schema: { type: "string", description: "Schema name (default: public)" },
        },
        required: ["table"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const schema = (args.schema as string) ?? "public";
          const result = await pg.query(
            `SELECT column_name, data_type, is_nullable, column_default,
                    character_maximum_length, numeric_precision
             FROM information_schema.columns
             WHERE table_schema = $1 AND table_name = $2
             ORDER BY ordinal_position`,
            [schema, args.table],
          );
          return result.rows;
        },
        (rows) => JSON.stringify(rows, null, 2),
      );
    },
  };

  const listSchemasTool: McpTool = {
    definition: {
      name: "list_schemas",
      description: "List all schemas in the database.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () => {
      return safeRun(
        async () => {
          const result = await pg.query(
            `SELECT schema_name FROM information_schema.schemata ORDER BY schema_name`,
          );
          return result.rows;
        },
        (rows) => JSON.stringify(rows, null, 2),
      );
    },
  };

  const databaseInfoTool: McpTool = {
    definition: {
      name: "database_info",
      description: "Get database server version, current database, and connection info.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () => {
      return safeRun(
        async () => {
          const version = await pg.query("SELECT version()");
          const currentDb = await pg.query("SELECT current_database(), current_user, inet_server_addr()");
          return {
            version: version.rows[0]?.version,
            database: currentDb.rows[0],
          };
        },
        (info) => JSON.stringify(info, null, 2),
      );
    },
  };

  return [queryTool, executeTool, listTablesTool, describeTableTool, listSchemasTool, databaseInfoTool];
}
