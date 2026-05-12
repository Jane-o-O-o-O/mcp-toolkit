import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMySQLTools, type MySQLClient } from "../src/tools/index.js";

function createMockMySQL(): MySQLClient {
  return {
    query: vi.fn(),
    end: vi.fn(),
    ping: vi.fn(),
  };
}

describe("MySQL MCP Tools", () => {
  let mockMySQL: ReturnType<typeof createMockMySQL>;
  let tools: ReturnType<typeof createMySQLTools>;

  beforeEach(() => {
    mockMySQL = createMockMySQL();
    tools = createMySQLTools(mockMySQL);
  });

  describe("tool definitions", () => {
    it("defines all expected tools", () => {
      const names = tools.map((t) => t.definition.name).sort();
      expect(names).toEqual([
        "describe_table",
        "execute",
        "explain",
        "list_tables",
        "query",
        "show_databases",
      ]);
    });

    it("each tool has required fields", () => {
      for (const tool of tools) {
        expect(tool.definition.name).toBeTruthy();
        expect(tool.definition.description).toBeTruthy();
        expect(tool.definition.inputSchema).toBeDefined();
        expect(typeof tool.handler).toBe("function");
      }
    });
  });

  describe("query", () => {
    it("returns query results", async () => {
      const rows = [{ id: 1, name: "Alice" }];
      vi.mocked(mockMySQL.query).mockResolvedValue([rows, []] as never);
      const tool = tools.find((t) => t.definition.name === "query")!;
      const result = await tool.handler({ sql: "SELECT * FROM users" });
      expect(mockMySQL.query).toHaveBeenCalledWith("SELECT * FROM users", []);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.rows).toBe(1);
      expect(parsed.data).toEqual(rows);
    });

    it("handles parameterized queries", async () => {
      vi.mocked(mockMySQL.query).mockResolvedValue([[{ id: 1 }], []] as never);
      const tool = tools.find((t) => t.definition.name === "query")!;
      await tool.handler({ sql: "SELECT * FROM users WHERE id = ?", params: [1] });
      expect(mockMySQL.query).toHaveBeenCalledWith("SELECT * FROM users WHERE id = ?", [1]);
    });

    it("returns error on failure", async () => {
      vi.mocked(mockMySQL.query).mockRejectedValue(new Error("Table not found"));
      const tool = tools.find((t) => t.definition.name === "query")!;
      const result = await tool.handler({ sql: "SELECT * FROM missing" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Table not found");
    });
  });

  describe("execute", () => {
    it("returns affected rows", async () => {
      vi.mocked(mockMySQL.query).mockResolvedValue(
        [{ affectedRows: 1, insertId: 5, changedRows: 1 }] as never,
      );
      const tool = tools.find((t) => t.definition.name === "execute")!;
      const result = await tool.handler({
        sql: "INSERT INTO users (name) VALUES (?)",
        params: ["Bob"],
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.affectedRows).toBe(1);
      expect(parsed.insertId).toBe(5);
    });
  });

  describe("list_tables", () => {
    it("returns table list", async () => {
      const tables = [{ TABLE_NAME: "users", TABLE_ROWS: 100, TABLE_TYPE: "BASE TABLE" }];
      vi.mocked(mockMySQL.query).mockResolvedValue([tables, []] as never);
      const tool = tools.find((t) => t.definition.name === "list_tables")!;
      const result = await tool.handler({});
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain("users");
    });
  });

  describe("describe_table", () => {
    it("returns column definitions", async () => {
      const columns = [
        { Field: "id", Type: "int", Null: "NO", Key: "PRI", Default: null },
        { Field: "name", Type: "varchar(255)", Null: "YES", Key: "", Default: null },
      ];
      vi.mocked(mockMySQL.query).mockResolvedValue([columns, []] as never);
      const tool = tools.find((t) => t.definition.name === "describe_table")!;
      const result = await tool.handler({ table: "users" });
      expect(mockMySQL.query).toHaveBeenCalled();
      expect(result.content[0].text).toContain("id");
    });
  });

  describe("explain", () => {
    it("returns execution plan", async () => {
      const plan = [{ id: 1, select_type: "SIMPLE", table: "users", type: "ALL" }];
      vi.mocked(mockMySQL.query).mockResolvedValue([plan, []] as never);
      const tool = tools.find((t) => t.definition.name === "explain")!;
      const result = await tool.handler({ sql: "SELECT * FROM users" });
      expect(result.content[0].text).toContain("SIMPLE");
    });
  });

  describe("show_databases", () => {
    it("returns database list", async () => {
      const dbs = [{ Database: "mydb" }, { Database: "information_schema" }];
      vi.mocked(mockMySQL.query).mockResolvedValue([dbs, []] as never);
      const tool = tools.find((t) => t.definition.name === "show_databases")!;
      const result = await tool.handler({});
      expect(result.content[0].text).toContain("mydb");
    });
  });
});
