import { describe, it, expect, vi } from "vitest";
import { createSupabaseTools } from "../src/tools/index.js";
import type { SupabaseClient } from "../src/tools/types.js";

function mockSupabaseClient(overrides: Partial<SupabaseClient> = {}): SupabaseClient {
  return {
    executeSql: vi.fn().mockResolvedValue({
      rows: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }],
      rowCount: 2,
      command: "SELECT",
    }),
    listTables: vi.fn().mockResolvedValue([
      { schema: "public", name: "users", type: "table", rowCount: 100, comment: null },
      { schema: "public", name: "posts", type: "table", rowCount: 50, comment: "Blog posts" },
    ]),
    getTableSchema: vi.fn().mockResolvedValue([
      { name: "id", type: "integer", nullable: false, defaultValue: "nextval(...)", isPrimaryKey: true, comment: null },
      { name: "name", type: "text", nullable: false, defaultValue: null, isPrimaryKey: false, comment: null },
      { name: "email", type: "text", nullable: true, defaultValue: null, isPrimaryKey: false, comment: "User email" },
    ]),
    insertRows: vi.fn().mockResolvedValue({
      rows: [{ id: 3, name: "Charlie" }],
      rowCount: 1,
    }),
    updateRows: vi.fn().mockResolvedValue({
      rows: [{ id: 1, name: "Alice Updated" }],
      rowCount: 1,
    }),
    deleteRows: vi.fn().mockResolvedValue({
      rows: [{ id: 2 }],
      rowCount: 1,
    }),
    listBuckets: vi.fn().mockResolvedValue([
      { id: "avatars", name: "avatars", public: true, fileCount: 42, createdAt: "2026-01-01T00:00:00Z" },
      { id: "documents", name: "documents", public: false, fileCount: 15, createdAt: "2026-02-01T00:00:00Z" },
    ]),
    uploadFile: vi.fn().mockResolvedValue({ path: "test.txt", fullPath: "avatars/test.txt" }),
    ...overrides,
  };
}

describe("Supabase tools", () => {
  it("should have 8 tools", () => {
    const tools = createSupabaseTools(mockSupabaseClient());
    expect(tools).toHaveLength(8);
  });

  describe("execute_sql", () => {
    it("should execute a SELECT query", async () => {
      const client = mockSupabaseClient();
      const tools = createSupabaseTools(client);
      const tool = tools.find((t) => t.definition.name === "execute_sql")!;

      const result = await tool.handler({ query: "SELECT * FROM users" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Alice");
      expect(result.content[0].text).toContain("Bob");
      expect(client.executeSql).toHaveBeenCalledWith("SELECT * FROM users", undefined);
    });

    it("should execute with params", async () => {
      const client = mockSupabaseClient();
      const tools = createSupabaseTools(client);
      const tool = tools.find((t) => t.definition.name === "execute_sql")!;

      await tool.handler({ query: "SELECT * FROM users WHERE id = $1", params: [1] });
      expect(client.executeSql).toHaveBeenCalledWith("SELECT * FROM users WHERE id = $1", [1]);
    });
  });

  describe("list_tables", () => {
    it("should list tables", async () => {
      const client = mockSupabaseClient();
      const tools = createSupabaseTools(client);
      const tool = tools.find((t) => t.definition.name === "list_tables")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("users");
      expect(result.content[0].text).toContain("posts");
    });

    it("should list tables with custom schema", async () => {
      const client = mockSupabaseClient();
      const tools = createSupabaseTools(client);
      const tool = tools.find((t) => t.definition.name === "list_tables")!;

      await tool.handler({ schema: "auth" });
      expect(client.listTables).toHaveBeenCalledWith("auth");
    });
  });

  describe("get_table_schema", () => {
    it("should get table schema", async () => {
      const client = mockSupabaseClient();
      const tools = createSupabaseTools(client);
      const tool = tools.find((t) => t.definition.name === "get_table_schema")!;

      const result = await tool.handler({ table_name: "users" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("integer");
      expect(result.content[0].text).toContain("isPrimaryKey");
    });
  });

  describe("insert_rows", () => {
    it("should insert rows", async () => {
      const client = mockSupabaseClient();
      const tools = createSupabaseTools(client);
      const tool = tools.find((t) => t.definition.name === "insert_rows")!;

      const result = await tool.handler({
        table_name: "users",
        rows: [{ name: "Charlie" }],
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Charlie");
      expect(client.insertRows).toHaveBeenCalledWith("users", [{ name: "Charlie" }], undefined);
    });
  });

  describe("update_rows", () => {
    it("should update rows with filter", async () => {
      const client = mockSupabaseClient();
      const tools = createSupabaseTools(client);
      const tool = tools.find((t) => t.definition.name === "update_rows")!;

      const result = await tool.handler({
        table_name: "users",
        updates: { name: "Alice Updated" },
        filter: { id: 1 },
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Alice Updated");
    });
  });

  describe("delete_rows", () => {
    it("should delete rows with filter", async () => {
      const client = mockSupabaseClient();
      const tools = createSupabaseTools(client);
      const tool = tools.find((t) => t.definition.name === "delete_rows")!;

      const result = await tool.handler({
        table_name: "users",
        filter: { id: 2 },
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("rowCount");
    });
  });

  describe("list_buckets", () => {
    it("should list storage buckets", async () => {
      const client = mockSupabaseClient();
      const tools = createSupabaseTools(client);
      const tool = tools.find((t) => t.definition.name === "list_buckets")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("avatars");
      expect(result.content[0].text).toContain("documents");
    });
  });

  describe("upload_file", () => {
    it("should upload a file", async () => {
      const client = mockSupabaseClient();
      const tools = createSupabaseTools(client);
      const tool = tools.find((t) => t.definition.name === "upload_file")!;

      const result = await tool.handler({
        bucket: "avatars",
        path: "test.txt",
        content: "Hello World",
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("fullPath");
    });
  });

  describe("error handling", () => {
    it("should return error on API failure", async () => {
      const client = mockSupabaseClient({
        executeSql: vi.fn().mockRejectedValue(new Error("permission denied")),
      });
      const tools = createSupabaseTools(client);
      const tool = tools.find((t) => t.definition.name === "execute_sql")!;

      const result = await tool.handler({ query: "DROP TABLE users" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("permission denied");
    });
  });
});
