import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSQLiteTools, type SQLiteDatabase } from "../src/tools/index.js";

// Mock SQLite database
function createMockDB(): SQLiteDatabase {
  const mockStmt = {
    run: vi.fn(),
    get: vi.fn(),
    all: vi.fn(),
    pluck: vi.fn().mockReturnThis(),
  };

  return {
    prepare: vi.fn().mockReturnValue(mockStmt),
    exec: vi.fn().mockReturnThis(),
    close: vi.fn(),
    open: true,
    name: ":memory:",
    readonly: false,
  };
}

describe("SQLite MCP Tools", () => {
  let mockDB: ReturnType<typeof createMockDB>;
  let tools: ReturnType<typeof createSQLiteTools>;

  beforeEach(() => {
    mockDB = createMockDB();
    tools = createSQLiteTools(mockDB as unknown as SQLiteDatabase);
  });

  describe("tool definitions", () => {
    it("defines all expected tools", () => {
      const names = tools.map((t) => t.definition.name).sort();
      expect(names).toEqual([
        "describe_table",
        "execute",
        "export_table",
        "list_tables",
        "query",
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
    it("executes a SELECT query and returns rows", async () => {
      const mockStmt = mockDB.prepare();
      mockStmt.all.mockReturnValue([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ]);

      const queryTool = tools.find((t) => t.definition.name === "query")!;
      const result = await queryTool.handler({ sql: "SELECT * FROM users" });

      expect(mockDB.prepare).toHaveBeenCalledWith("SELECT * FROM users");
      expect(mockStmt.all).toHaveBeenCalled();
      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed).toEqual([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ]);
    });

    it("passes parameters to the query", async () => {
      const mockStmt = mockDB.prepare();
      mockStmt.all.mockReturnValue([{ id: 1, name: "Alice" }]);

      const queryTool = tools.find((t) => t.definition.name === "query")!;
      await queryTool.handler({
        sql: "SELECT * FROM users WHERE id = ?",
        params: [1],
      });

      expect(mockStmt.all).toHaveBeenCalledWith(1);
    });

    it("returns empty array for no results", async () => {
      const mockStmt = mockDB.prepare();
      mockStmt.all.mockReturnValue([]);

      const queryTool = tools.find((t) => t.definition.name === "query")!;
      const result = await queryTool.handler({ sql: "SELECT * FROM empty" });

      expect(result.content[0].text).toBe("[]");
    });
  });

  describe("execute", () => {
    it("executes an INSERT and returns changes", async () => {
      const mockStmt = mockDB.prepare();
      mockStmt.run.mockReturnValue({ changes: 1, lastInsertRowid: 5 });

      const executeTool = tools.find((t) => t.definition.name === "execute")!;
      const result = await executeTool.handler({
        sql: "INSERT INTO users (name) VALUES (?)",
        params: ["Charlie"],
      });

      expect(mockDB.prepare).toHaveBeenCalledWith(
        "INSERT INTO users (name) VALUES (?)",
      );
      expect(mockStmt.run).toHaveBeenCalledWith("Charlie");
      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed).toEqual({ changes: 1, lastInsertRowid: 5 });
    });

    it("executes a CREATE TABLE statement", async () => {
      const mockStmt = mockDB.prepare();
      mockStmt.run.mockReturnValue({ changes: 0, lastInsertRowid: 0 });

      const executeTool = tools.find((t) => t.definition.name === "execute")!;
      const result = await executeTool.handler({
        sql: "CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)",
      });

      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed.changes).toBe(0);
    });

    it("executes DELETE and reports changes", async () => {
      const mockStmt = mockDB.prepare();
      mockStmt.run.mockReturnValue({ changes: 3, lastInsertRowid: 0 });

      const executeTool = tools.find((t) => t.definition.name === "execute")!;
      const result = await executeTool.handler({
        sql: "DELETE FROM users WHERE active = ?",
        params: [0],
      });

      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed.changes).toBe(3);
    });
  });

  describe("list_tables", () => {
    it("returns table names", async () => {
      const mockStmt = mockDB.prepare();
      mockStmt.all.mockReturnValue([{ name: "users" }, { name: "posts" }]);

      const listTablesTool = tools.find(
        (t) => t.definition.name === "list_tables",
      )!;
      const result = await listTablesTool.handler({});

      expect(mockDB.prepare).toHaveBeenCalledWith(
        expect.stringContaining("sqlite_master"),
      );
      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed).toEqual(["users", "posts"]);
    });

    it("returns empty array when no tables exist", async () => {
      const mockStmt = mockDB.prepare();
      mockStmt.all.mockReturnValue([]);

      const listTablesTool = tools.find(
        (t) => t.definition.name === "list_tables",
      )!;
      const result = await listTablesTool.handler({});

      expect(result.content[0].text).toBe("[]");
    });
  });

  describe("describe_table", () => {
    it("returns table schema with columns", async () => {
      const mockStmt = mockDB.prepare();

      // First call: PRAGMA table_info
      // Second call: SELECT COUNT(*)
      // Third call: SELECT sql FROM sqlite_master
      mockStmt.all
        .mockReturnValueOnce([
          { cid: 0, name: "id", type: "INTEGER", notnull: 1, dflt_value: null, pk: 1 },
          { cid: 1, name: "name", type: "TEXT", notnull: 0, dflt_value: null, pk: 0 },
        ]);

      mockStmt.get
        .mockReturnValueOnce({ count: 42 })
        .mockReturnValueOnce({ sql: "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)" });

      const describeTool = tools.find(
        (t) => t.definition.name === "describe_table",
      )!;
      const result = await describeTool.handler({ table: "users" });

      expect(mockDB.prepare).toHaveBeenCalledWith("PRAGMA table_info('users')");
      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed.table).toBe("users");
      expect(parsed.rowCount).toBe(42);
      expect(parsed.columns).toHaveLength(2);
      expect(parsed.columns[0].name).toBe("id");
      expect(parsed.columns[0].pk).toBe(true);
      expect(parsed.columns[1].name).toBe("name");
    });

    it("throws error for non-existent table", async () => {
      const mockStmt = mockDB.prepare();
      mockStmt.all.mockReturnValueOnce([]);

      const describeTool = tools.find(
        (t) => t.definition.name === "describe_table",
      )!;
      const result = await describeTool.handler({ table: "nonexistent" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("does not exist");
    });
  });

  describe("export_table", () => {
    it("exports table data with default limit", async () => {
      const mockStmt = mockDB.prepare();
      mockStmt.all.mockReturnValue([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ]);

      const exportTool = tools.find(
        (t) => t.definition.name === "export_table",
      )!;
      const result = await exportTool.handler({ table: "users" });

      expect(mockDB.prepare).toHaveBeenCalledWith(
        "SELECT * FROM 'users' LIMIT 100",
      );
      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed).toHaveLength(2);
    });

    it("applies custom limit", async () => {
      const mockStmt = mockDB.prepare();
      mockStmt.all.mockReturnValue([{ id: 1 }]);

      const exportTool = tools.find(
        (t) => t.definition.name === "export_table",
      )!;
      await exportTool.handler({ table: "users", limit: 5 });

      expect(mockDB.prepare).toHaveBeenCalledWith(
        "SELECT * FROM 'users' LIMIT 5",
      );
    });

    it("applies WHERE clause", async () => {
      const mockStmt = mockDB.prepare();
      mockStmt.all.mockReturnValue([{ id: 1, name: "Alice" }]);

      const exportTool = tools.find(
        (t) => t.definition.name === "export_table",
      )!;
      await exportTool.handler({ table: "users", where: "id = 1" });

      expect(mockDB.prepare).toHaveBeenCalledWith(
        "SELECT * FROM 'users' WHERE id = 1 LIMIT 100",
      );
    });
  });

  describe("error handling", () => {
    it("wraps database errors gracefully", async () => {
      const mockStmt = mockDB.prepare();
      mockStmt.all.mockImplementation(() => {
        throw new Error("no such table: invalid");
      });

      const queryTool = tools.find((t) => t.definition.name === "query")!;
      const result = await queryTool.handler({ sql: "SELECT * FROM invalid" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("no such table: invalid");
    });

    it("wraps non-Error exceptions", async () => {
      const mockStmt = mockDB.prepare();
      mockStmt.all.mockImplementation(() => {
        throw "string error";
      });

      const queryTool = tools.find((t) => t.definition.name === "query")!;
      const result = await queryTool.handler({ sql: "SELECT * FROM invalid" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("string error");
    });
  });
});
