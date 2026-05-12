import type { MySQLClient } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createMySQLTools(mysql: MySQLClient): McpTool[] {
  const queryTool: McpTool = {
    definition: {
      name: "query",
      description:
        "Execute a read-only SQL query (SELECT) and return results as JSON. Supports parameterized queries with ? placeholders.",
      inputSchema: {
        type: "object",
        properties: {
          sql: { type: "string", description: "SQL SELECT query to execute" },
          params: {
            type: "array",
            items: { type: ["string", "number", "boolean", "null"] },
            description: "Parameterized query values (use ? placeholders)",
          },
        },
        required: ["sql"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const [rows] = await mysql.query(
            args.sql as string,
            (args.params as unknown[]) ?? [],
          );
          return { rows: rows.length, data: rows };
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const executeTool: McpTool = {
    definition: {
      name: "execute",
      description:
        "Execute a write SQL statement (INSERT, UPDATE, DELETE, CREATE, ALTER). Returns affected row count and insert ID.",
      inputSchema: {
        type: "object",
        properties: {
          sql: { type: "string", description: "SQL statement to execute" },
          params: {
            type: "array",
            items: { type: ["string", "number", "boolean", "null"] },
            description: "Statement parameters (? placeholders)",
          },
        },
        required: ["sql"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const [result] = await mysql.query(
            args.sql as string,
            (args.params as unknown[]) ?? [],
          );
          const meta = result as unknown as {
            affectedRows?: number;
            insertId?: number;
            changedRows?: number;
          };
          return {
            affectedRows: meta.affectedRows ?? 0,
            insertId: meta.insertId ?? 0,
            changedRows: meta.changedRows ?? 0,
          };
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const listTablesTool: McpTool = {
    definition: {
      name: "list_tables",
      description: "List all tables in the current database with row count estimates.",
      inputSchema: { type: "object", properties: {} },
    },
    handler: async () => {
      return safeRun(
        async () => {
          const [rows] = await mysql.query(
            "SELECT TABLE_NAME, TABLE_ROWS, TABLE_TYPE FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()",
          );
          return rows;
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const describeTableTool: McpTool = {
    definition: {
      name: "describe_table",
      description: "Show the column definitions for a table (name, type, nullable, key, default).",
      inputSchema: {
        type: "object",
        properties: {
          table: { type: "string", description: "Table name to describe" },
        },
        required: ["table"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const [rows] = await mysql.query(
            "DESCRIBE ??",
            [args.table as string],
          );
          return rows;
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const explainTool: McpTool = {
    definition: {
      name: "explain",
      description: "Run EXPLAIN on a SQL query to analyze its execution plan.",
      inputSchema: {
        type: "object",
        properties: {
          sql: { type: "string", description: "SQL query to explain" },
        },
        required: ["sql"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const [rows] = await mysql.query(
            `EXPLAIN ${args.sql as string}`,
          );
          return rows;
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const showDatabasesTool: McpTool = {
    definition: {
      name: "show_databases",
      description: "List all available databases on the MySQL server.",
      inputSchema: { type: "object", properties: {} },
    },
    handler: async () => {
      return safeRun(
        async () => {
          const [rows] = await mysql.query("SHOW DATABASES");
          return rows;
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  return [queryTool, executeTool, listTablesTool, describeTableTool, explainTool, showDatabasesTool];
}
