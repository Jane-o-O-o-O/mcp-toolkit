import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createSQLiteTools } from "../src/tools/index.js";
import Database from "better-sqlite3";

describe("SQLite Integration Tests (real in-memory DB)", () => {
  let db: InstanceType<typeof Database>;
  let tools: ReturnType<typeof createSQLiteTools>;

  beforeAll(() => {
    db = new Database(":memory:");
    tools = createSQLiteTools(db as any);
  });

  afterAll(() => {
    db.close();
  });

  describe("full workflow", () => {
    it("should create a table, insert data, query it, and describe it", async () => {
      const executeTool = tools.find((t) => t.definition.name === "execute")!;
      const queryTool = tools.find((t) => t.definition.name === "query")!;
      const listTablesTool = tools.find((t) => t.definition.name === "list_tables")!;
      const describeTool = tools.find((t) => t.definition.name === "describe_table")!;

      // Create table
      const createResult = await executeTool.handler({
        sql: "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE, age INTEGER)",
      });
      expect(createResult.isError).toBeUndefined();

      // Insert data
      const insertResult = await executeTool.handler({
        sql: "INSERT INTO users (name, email, age) VALUES (?, ?, ?)",
        params: ["Alice", "alice@example.com", 30],
      });
      expect(insertResult.isError).toBeUndefined();
      const insertData = JSON.parse(insertResult.content[0].text as string);
      expect(insertData.changes).toBe(1);

      // Insert more data
      await executeTool.handler({
        sql: "INSERT INTO users (name, email, age) VALUES (?, ?, ?)",
        params: ["Bob", "bob@example.com", 25],
      });
      await executeTool.handler({
        sql: "INSERT INTO users (name, email, age) VALUES (?, ?, ?)",
        params: ["Charlie", "charlie@example.com", 35],
      });

      // Query all
      const queryResult = await queryTool.handler({ sql: "SELECT * FROM users ORDER BY id" });
      expect(queryResult.isError).toBeUndefined();
      const users = JSON.parse(queryResult.content[0].text as string);
      expect(users).toHaveLength(3);
      expect(users[0].name).toBe("Alice");
      expect(users[1].name).toBe("Bob");
      expect(users[2].name).toBe("Charlie");

      // Query with filter
      const filterResult = await queryTool.handler({
        sql: "SELECT name FROM users WHERE age > ?",
        params: [28],
      });
      const filtered = JSON.parse(filterResult.content[0].text as string);
      expect(filtered).toHaveLength(2);
      expect(filtered.map((u: any) => u.name)).toEqual(["Alice", "Charlie"]);

      // List tables
      const tablesResult = await listTablesTool.handler({});
      const tables = JSON.parse(tablesResult.content[0].text as string);
      expect(tables).toContain("users");

      // Describe table
      const descResult = await describeTool.handler({ table: "users" });
      expect(descResult.isError).toBeUndefined();
      const desc = JSON.parse(descResult.content[0].text as string);
      expect(desc.table).toBe("users");
      expect(desc.rowCount).toBe(3);
      expect(desc.columns).toHaveLength(4);
      expect(desc.columns[0].name).toBe("id");
      expect(desc.columns[0].pk).toBe(true);
      expect(desc.columns[1].name).toBe("name");
      expect(desc.columns[1].notnull).toBe(true);
    });

    it("should export table data", async () => {
      const exportTool = tools.find((t) => t.definition.name === "export_table")!;

      const result = await exportTool.handler({ table: "users", limit: 2 });
      expect(result.isError).toBeUndefined();
      const exported = JSON.parse(result.content[0].text as string);
      expect(exported).toHaveLength(2);
    });

    it("should handle errors gracefully", async () => {
      const queryTool = tools.find((t) => t.definition.name === "query")!;

      const result = await queryTool.handler({ sql: "SELECT * FROM nonexistent" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("no such table");
    });

    it("should handle duplicate unique constraint", async () => {
      const executeTool = tools.find((t) => t.definition.name === "execute")!;

      const result = await executeTool.handler({
        sql: "INSERT INTO users (name, email, age) VALUES (?, ?, ?)",
        params: ["Duplicate", "alice@example.com", 40],
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("UNIQUE");
    });
  });
});
