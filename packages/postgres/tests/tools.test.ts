import { describe, it, expect, vi } from "vitest";
import { createPostgresTools } from "../src/tools/tools.js";
import type { PostgresClient } from "../src/tools/types.js";

function mockPg(overrides: Partial<PostgresClient> = {}): PostgresClient {
  return {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0, command: "SELECT" }),
    end: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("PostgreSQL tools", () => {
  describe("query", () => {
    it("should execute a SELECT query", async () => {
      const mockRows = [{ id: 1, name: "alice" }, { id: 2, name: "bob" }];
      const pg = mockPg({
        query: vi.fn().mockResolvedValue({ rows: mockRows, rowCount: 2, command: "SELECT" }),
      });

      const tools = createPostgresTools(pg);
      const queryTool = tools.find((t) => t.definition.name === "query")!;

      const result = await queryTool.handler({ sql: "SELECT * FROM users" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("alice");
      expect(pg.query).toHaveBeenCalledWith("SELECT * FROM users", undefined);
    });

    it("should pass query parameters", async () => {
      const pg = mockPg({
        query: vi.fn().mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1, command: "SELECT" }),
      });

      const tools = createPostgresTools(pg);
      const queryTool = tools.find((t) => t.definition.name === "query")!;

      await queryTool.handler({ sql: "SELECT * FROM users WHERE id = $1", params: ["1"] });
      expect(pg.query).toHaveBeenCalledWith("SELECT * FROM users WHERE id = $1", ["1"]);
    });

    it("should handle query errors", async () => {
      const pg = mockPg({
        query: vi.fn().mockRejectedValue(new Error("syntax error")),
      });

      const tools = createPostgresTools(pg);
      const queryTool = tools.find((t) => t.definition.name === "query")!;

      const result = await queryTool.handler({ sql: "INVALID SQL" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("syntax error");
    });
  });

  describe("execute", () => {
    it("should execute INSERT and return rowCount", async () => {
      const pg = mockPg({
        query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1, command: "INSERT" }),
      });

      const tools = createPostgresTools(pg);
      const execTool = tools.find((t) => t.definition.name === "execute")!;

      const result = await execTool.handler({
        sql: "INSERT INTO users (name) VALUES ($1)",
        params: ["charlie"],
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('"rowCount": 1');
      expect(result.content[0].text).toContain('"command": "INSERT"');
    });
  });

  describe("list_tables", () => {
    it("should list tables in public schema by default", async () => {
      const pg = mockPg({
        query: vi.fn().mockResolvedValue({
          rows: [
            { schemaname: "public", tablename: "users", tableowner: "admin" },
            { schemaname: "public", tablename: "orders", tableowner: "admin" },
          ],
          rowCount: 2,
          command: "SELECT",
        }),
      });

      const tools = createPostgresTools(pg);
      const listTool = tools.find((t) => t.definition.name === "list_tables")!;

      const result = await listTool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("users");
      expect(result.content[0].text).toContain("orders");
    });

    it("should accept custom schema", async () => {
      const pg = mockPg({
        query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0, command: "SELECT" }),
      });

      const tools = createPostgresTools(pg);
      const listTool = tools.find((t) => t.definition.name === "list_tables")!;

      await listTool.handler({ schema: "myschema" });
      expect(pg.query).toHaveBeenCalledWith(
        expect.stringContaining("schemaname = $1"),
        ["myschema"],
      );
    });
  });

  describe("describe_table", () => {
    it("should return column info for a table", async () => {
      const columns = [
        { column_name: "id", data_type: "integer", is_nullable: "NO", column_default: "nextval(...)" },
        { column_name: "name", data_type: "character varying", is_nullable: "YES", column_default: null },
      ];
      const pg = mockPg({
        query: vi.fn().mockResolvedValue({ rows: columns, rowCount: 2, command: "SELECT" }),
      });

      const tools = createPostgresTools(pg);
      const descTool = tools.find((t) => t.definition.name === "describe_table")!;

      const result = await descTool.handler({ table: "users" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("id");
      expect(result.content[0].text).toContain("name");
    });
  });

  describe("list_schemas", () => {
    it("should list all schemas", async () => {
      const pg = mockPg({
        query: vi.fn().mockResolvedValue({
          rows: [{ schema_name: "public" }, { schema_name: "information_schema" }],
          rowCount: 2,
          command: "SELECT",
        }),
      });

      const tools = createPostgresTools(pg);
      const schemaTool = tools.find((t) => t.definition.name === "list_schemas")!;

      const result = await schemaTool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("public");
    });
  });

  describe("database_info", () => {
    it("should return version and database info", async () => {
      const pg = mockPg({
        query: vi.fn()
          .mockResolvedValueOnce({ rows: [{ version: "PostgreSQL 16.0" }], rowCount: 1, command: "SELECT" })
          .mockResolvedValueOnce({
            rows: [{ current_database: "testdb", current_user: "admin", inet_server_addr: "127.0.0.1" }],
            rowCount: 1,
            command: "SELECT",
          }),
      });

      const tools = createPostgresTools(pg);
      const infoTool = tools.find((t) => t.definition.name === "database_info")!;

      const result = await infoTool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("PostgreSQL 16.0");
      expect(result.content[0].text).toContain("testdb");
    });
  });

  describe("tool definitions", () => {
    it("should have 6 tools", () => {
      const tools = createPostgresTools(mockPg());
      expect(tools).toHaveLength(6);
    });

    it("each tool should have name, description, and inputSchema", () => {
      const tools = createPostgresTools(mockPg());
      for (const tool of tools) {
        expect(tool.definition.name).toBeTruthy();
        expect(tool.definition.description).toBeTruthy();
        expect(tool.definition.inputSchema.type).toBe("object");
      }
    });
  });
});
