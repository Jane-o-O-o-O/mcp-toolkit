import type { SQLiteDatabase } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRunSync } from "@mcp-toolkit/core";

export function createSQLiteTools(db: SQLiteDatabase): McpTool[] {
  function run<T>(fn: () => T) {
    return safeRunSync(fn, (r) => typeof r === "string" ? r : JSON.stringify(r, null, 2));
  }

  const queryTool: McpTool = {
    definition: {
      name: "query",
      description:
        "Execute a read-only SQL query (SELECT). Returns results as a JSON array of row objects. Use for data retrieval and analysis.",
      inputSchema: {
        type: "object",
        properties: {
          sql: { type: "string", description: "SQL SELECT query to execute" },
          params: {
            type: "array",
            items: { type: ["string", "number", "boolean", "null"] },
            description: "Parameterized query values (use ? placeholders in SQL)",
          },
        },
        required: ["sql"],
      },
    },
    handler: async (args) => {
      return run(() => {
        const sql = args.sql as string;
        const params = (args.params as unknown[]) ?? [];
        const stmt = db.prepare(sql);
        const rows = stmt.all(...params);
        return rows;
      });
    },
  };

  const executeTool: McpTool = {
    definition: {
      name: "execute",
      description:
        "Execute a write SQL statement (INSERT, UPDATE, DELETE, CREATE TABLE, DROP TABLE, etc.). Returns { changes, lastInsertRowid }.",
      inputSchema: {
        type: "object",
        properties: {
          sql: { type: "string", description: "SQL statement to execute" },
          params: {
            type: "array",
            items: { type: ["string", "number", "boolean", "null"] },
            description: "Parameterized statement values (use ? placeholders in SQL)",
          },
        },
        required: ["sql"],
      },
    },
    handler: async (args) => {
      return run(() => {
        const sql = args.sql as string;
        const params = (args.params as unknown[]) ?? [];
        const stmt = db.prepare(sql);
        const result = stmt.run(...params);
        return {
          changes: result.changes,
          lastInsertRowid: Number(result.lastInsertRowid),
        };
      });
    },
  };

  const listTablesTool: McpTool = {
    definition: {
      name: "list_tables",
      description:
        "List all user-created tables in the database. Returns an array of table names.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () => {
      return run(() => {
        const stmt = db.prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
        );
        const rows = stmt.all() as Record<string, unknown>[];
        return rows.map((r) => r.name as string);
      });
    },
  };

  const describeTableTool: McpTool = {
    definition: {
      name: "describe_table",
      description:
        "Get the schema of a table — column names, types, and constraints. Also returns row count and CREATE TABLE statement.",
      inputSchema: {
        type: "object",
        properties: {
          table: { type: "string", description: "Table name to describe" },
        },
        required: ["table"],
      },
    },
    handler: async (args) => {
      return run(() => {
        const table = args.table as string;

        const columns = db.prepare(`PRAGMA table_info('${table}')`).all() as Record<
          string,
          unknown
        >[];

        if (columns.length === 0) {
          throw new Error(`Table '${table}' does not exist`);
        }

        const countRow = db.prepare(`SELECT COUNT(*) as count FROM '${table}'`).get() as
          | Record<string, unknown>
          | undefined;
        const rowCount = (countRow?.count as number) ?? 0;

        const createRow = db
          .prepare(
            `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`,
          )
          .get(table) as Record<string, unknown> | undefined;

        return {
          table,
          rowCount,
          createSQL: createRow?.sql as string,
          columns: columns.map((c) => ({
            cid: c.cid as number,
            name: c.name as string,
            type: c.type as string,
            notnull: c.notnull === 1,
            dfltValue: c.dflt_value,
            pk: c.pk === 1,
          })),
        };
      });
    },
  };

  const exportTableTool: McpTool = {
    definition: {
      name: "export_table",
      description:
        "Export table data as JSON. Optionally limit rows and filter with a WHERE clause.",
      inputSchema: {
        type: "object",
        properties: {
          table: { type: "string", description: "Table name to export" },
          limit: {
            type: "number",
            description: "Maximum number of rows to return (default: 100)",
          },
          where: {
            type: "string",
            description: "Optional WHERE clause (without the WHERE keyword)",
          },
        },
        required: ["table"],
      },
    },
    handler: async (args) => {
      return run(() => {
        const table = args.table as string;
        const limit = (args.limit as number) ?? 100;
        const where = args.where as string | undefined;

        let sql = `SELECT * FROM '${table}'`;
        if (where) {
          sql += ` WHERE ${where}`;
        }
        sql += ` LIMIT ${limit}`;

        const rows = db.prepare(sql).all();
        return rows;
      });
    },
  };

  return [queryTool, executeTool, listTablesTool, describeTableTool, exportTableTool];
}
