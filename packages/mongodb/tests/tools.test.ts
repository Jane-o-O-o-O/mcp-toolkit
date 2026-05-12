import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMongoDBTools, type MongoDBClient } from "../src/tools/index.js";

function createMockMongo(): MongoDBClient {
  return {
    listDatabases: vi.fn(),
    listCollections: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    insertOne: vi.fn(),
    insertMany: vi.fn(),
    updateOne: vi.fn(),
    updateMany: vi.fn(),
    deleteOne: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    close: vi.fn(),
  };
}

describe("MongoDB MCP Tools", () => {
  let mockMongo: ReturnType<typeof createMockMongo>;
  let tools: ReturnType<typeof createMongoDBTools>;

  beforeEach(() => {
    mockMongo = createMockMongo();
    tools = createMongoDBTools(mockMongo);
  });

  describe("tool definitions", () => {
    it("defines all expected tools", () => {
      const names = tools.map((t) => t.definition.name).sort();
      expect(names).toEqual([
        "aggregate",
        "count",
        "delete_many",
        "delete_one",
        "find",
        "find_one",
        "insert_many",
        "insert_one",
        "list_collections",
        "list_databases",
        "update_many",
        "update_one",
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

  describe("list_databases", () => {
    it("returns database list", async () => {
      const dbs = [{ name: "mydb", sizeOnDisk: 1024 }];
      vi.mocked(mockMongo.listDatabases).mockResolvedValue(dbs);
      const tool = tools.find((t) => t.definition.name === "list_databases")!;
      const result = await tool.handler({});
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain("mydb");
    });
  });

  describe("list_collections", () => {
    it("returns collection names", async () => {
      vi.mocked(mockMongo.listCollections).mockResolvedValue(["users", "posts"]);
      const tool = tools.find((t) => t.definition.name === "list_collections")!;
      const result = await tool.handler({ database: "mydb" });
      expect(mockMongo.listCollections).toHaveBeenCalledWith("mydb");
      expect(result.content[0].text).toContain("users");
    });
  });

  describe("find", () => {
    it("queries with filter and options", async () => {
      const docs = [{ _id: "1", name: "Alice" }];
      vi.mocked(mockMongo.find).mockResolvedValue(docs);
      const tool = tools.find((t) => t.definition.name === "find")!;
      const result = await tool.handler({
        database: "mydb",
        collection: "users",
        filter: { name: "Alice" },
        limit: 10,
      });
      expect(mockMongo.find).toHaveBeenCalledWith("mydb", "users", { name: "Alice" }, { limit: 10 });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.count).toBe(1);
    });

    it("uses empty filter by default", async () => {
      vi.mocked(mockMongo.find).mockResolvedValue([]);
      const tool = tools.find((t) => t.definition.name === "find")!;
      await tool.handler({ database: "mydb", collection: "users" });
      expect(mockMongo.find).toHaveBeenCalledWith("mydb", "users", {}, {});
    });
  });

  describe("find_one", () => {
    it("returns a single document", async () => {
      vi.mocked(mockMongo.findOne).mockResolvedValue({ _id: "1", name: "Alice" });
      const tool = tools.find((t) => t.definition.name === "find_one")!;
      const result = await tool.handler({ database: "mydb", collection: "users", filter: { _id: "1" } });
      expect(result.content[0].text).toContain("Alice");
    });
  });

  describe("insert_one", () => {
    it("inserts a document", async () => {
      vi.mocked(mockMongo.insertOne).mockResolvedValue({ insertedId: "abc123" });
      const tool = tools.find((t) => t.definition.name === "insert_one")!;
      const result = await tool.handler({
        database: "mydb",
        collection: "users",
        document: { name: "Bob" },
      });
      expect(result.content[0].text).toContain("abc123");
    });
  });

  describe("insert_many", () => {
    it("inserts multiple documents", async () => {
      vi.mocked(mockMongo.insertMany).mockResolvedValue({ insertedIds: ["1", "2"] });
      const tool = tools.find((t) => t.definition.name === "insert_many")!;
      const result = await tool.handler({
        database: "mydb",
        collection: "users",
        documents: [{ name: "A" }, { name: "B" }],
      });
      expect(result.content[0].text).toContain("2");
    });
  });

  describe("update_one", () => {
    it("updates a document", async () => {
      vi.mocked(mockMongo.updateOne).mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
      const tool = tools.find((t) => t.definition.name === "update_one")!;
      const result = await tool.handler({
        database: "mydb",
        collection: "users",
        filter: { _id: "1" },
        update: { $set: { name: "Updated" } },
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.modifiedCount).toBe(1);
    });
  });

  describe("update_many", () => {
    it("updates multiple documents", async () => {
      vi.mocked(mockMongo.updateMany).mockResolvedValue({ matchedCount: 5, modifiedCount: 3 });
      const tool = tools.find((t) => t.definition.name === "update_many")!;
      const result = await tool.handler({
        database: "mydb",
        collection: "users",
        filter: { active: false },
        update: { $set: { active: true } },
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.matchedCount).toBe(5);
    });
  });

  describe("delete_one", () => {
    it("deletes a document", async () => {
      vi.mocked(mockMongo.deleteOne).mockResolvedValue({ deletedCount: 1 });
      const tool = tools.find((t) => t.definition.name === "delete_one")!;
      const result = await tool.handler({
        database: "mydb",
        collection: "users",
        filter: { _id: "1" },
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.deletedCount).toBe(1);
    });
  });

  describe("delete_many", () => {
    it("deletes multiple documents", async () => {
      vi.mocked(mockMongo.deleteMany).mockResolvedValue({ deletedCount: 10 });
      const tool = tools.find((t) => t.definition.name === "delete_many")!;
      const result = await tool.handler({
        database: "mydb",
        collection: "users",
        filter: { active: false },
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.deletedCount).toBe(10);
    });
  });

  describe("count", () => {
    it("counts documents", async () => {
      vi.mocked(mockMongo.count).mockResolvedValue(42);
      const tool = tools.find((t) => t.definition.name === "count")!;
      const result = await tool.handler({ database: "mydb", collection: "users" });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.count).toBe(42);
    });
  });

  describe("aggregate", () => {
    it("runs aggregation pipeline", async () => {
      vi.mocked(mockMongo.aggregate).mockResolvedValue([{ _id: "active", count: 5 }]);
      const tool = tools.find((t) => t.definition.name === "aggregate")!;
      const result = await tool.handler({
        database: "mydb",
        collection: "users",
        pipeline: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
      });
      expect(result.content[0].text).toContain("active");
    });
  });

  describe("error handling", () => {
    it("returns error on failure", async () => {
      vi.mocked(mockMongo.find).mockRejectedValue(new Error("Connection lost"));
      const tool = tools.find((t) => t.definition.name === "find")!;
      const result = await tool.handler({ database: "mydb", collection: "users" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Connection lost");
    });
  });
});
