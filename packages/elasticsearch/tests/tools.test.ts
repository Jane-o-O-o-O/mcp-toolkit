import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElasticsearchTools, type ElasticsearchClient } from "../src/tools/index.js";

function createMockES(): ElasticsearchClient {
  return {
    search: vi.fn(),
    index: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    bulk: vi.fn(),
    indices: {
      exists: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      getMapping: vi.fn(),
      stats: vi.fn(),
    },
    count: vi.fn(),
    cluster: {
      health: vi.fn(),
    },
    info: vi.fn(),
  };
}

describe("Elasticsearch MCP Tools", () => {
  let mockES: ReturnType<typeof createMockES>;
  let tools: ReturnType<typeof createElasticsearchTools>;

  beforeEach(() => {
    mockES = createMockES();
    tools = createElasticsearchTools(mockES);
  });

  describe("tool definitions", () => {
    it("defines all expected tools", () => {
      const names = tools.map((t) => t.definition.name).sort();
      expect(names).toEqual([
        "bulk",
        "cluster_health",
        "count",
        "create_index",
        "delete_document",
        "delete_index",
        "get_document",
        "index_document",
        "index_mapping",
        "list_indices",
        "search",
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

  describe("search", () => {
    it("returns search results", async () => {
      vi.mocked(mockES.search).mockResolvedValue({
        hits: {
          hits: [{ _id: "1", _source: { title: "Hello" }, _score: 1.0 }],
          total: { value: 1, relation: "eq" },
        },
      });
      const tool = tools.find((t) => t.definition.name === "search")!;
      const result = await tool.handler({ index: "test", query: { match: { title: "Hello" } } });
      expect(mockES.search).toHaveBeenCalledWith({
        index: "test",
        body: { query: { match: { title: "Hello" } }, size: 10, from: 0 },
      });
      expect(result.content[0].text).toContain("Hello");
    });

    it("uses match_all when no query provided", async () => {
      vi.mocked(mockES.search).mockResolvedValue({
        hits: { hits: [], total: { value: 0, relation: "eq" } },
      });
      const tool = tools.find((t) => t.definition.name === "search")!;
      await tool.handler({ index: "test" });
      expect(mockES.search).toHaveBeenCalledWith({
        index: "test",
        body: { query: { match_all: {} }, size: 10, from: 0 },
      });
    });

    it("supports pagination", async () => {
      vi.mocked(mockES.search).mockResolvedValue({
        hits: { hits: [], total: { value: 100, relation: "eq" } },
      });
      const tool = tools.find((t) => t.definition.name === "search")!;
      await tool.handler({ index: "test", size: 5, from: 10 });
      expect(mockES.search).toHaveBeenCalledWith({
        index: "test",
        body: { query: { match_all: {} }, size: 5, from: 10 },
      });
    });
  });

  describe("index_document", () => {
    it("indexes a document", async () => {
      vi.mocked(mockES.index).mockResolvedValue({ _id: "abc123", result: "created" });
      const tool = tools.find((t) => t.definition.name === "index_document")!;
      const result = await tool.handler({ index: "test", document: { title: "New" } });
      expect(mockES.index).toHaveBeenCalledWith({
        index: "test",
        id: undefined,
        body: { title: "New" },
        refresh: "wait_for",
      });
      expect(result.content[0].text).toContain("abc123");
      expect(result.content[0].text).toContain("created");
    });

    it("indexes with a specific ID", async () => {
      vi.mocked(mockES.index).mockResolvedValue({ _id: "my-id", result: "updated" });
      const tool = tools.find((t) => t.definition.name === "index_document")!;
      await tool.handler({ index: "test", document: { title: "Upd" }, id: "my-id" });
      expect(mockES.index).toHaveBeenCalledWith({
        index: "test",
        id: "my-id",
        body: { title: "Upd" },
        refresh: "wait_for",
      });
    });
  });

  describe("get_document", () => {
    it("returns a found document", async () => {
      vi.mocked(mockES.get).mockResolvedValue({
        _id: "1",
        _source: { title: "Found" },
        found: true,
      });
      const tool = tools.find((t) => t.definition.name === "get_document")!;
      const result = await tool.handler({ index: "test", id: "1" });
      expect(result.content[0].text).toContain("Found");
    });

    it("returns not found message", async () => {
      vi.mocked(mockES.get).mockResolvedValue({ _id: "missing", _source: {}, found: false });
      const tool = tools.find((t) => t.definition.name === "get_document")!;
      const result = await tool.handler({ index: "test", id: "missing" });
      expect(result.content[0].text).toContain("not found");
    });
  });

  describe("delete_document", () => {
    it("deletes a document", async () => {
      vi.mocked(mockES.delete).mockResolvedValue({ _id: "1", result: "deleted" });
      const tool = tools.find((t) => t.definition.name === "delete_document")!;
      const result = await tool.handler({ index: "test", id: "1" });
      expect(mockES.delete).toHaveBeenCalledWith({ index: "test", id: "1", refresh: "wait_for" });
      expect(result.content[0].text).toContain("deleted");
    });
  });

  describe("bulk", () => {
    it("executes bulk index operations", async () => {
      vi.mocked(mockES.bulk).mockResolvedValue({ errors: false, items: [{ index: { result: "created" } }] });
      const tool = tools.find((t) => t.definition.name === "bulk")!;
      const result = await tool.handler({
        operations: [{ action: "index", index: "test", document: { title: "Doc" } }],
      });
      expect(mockES.bulk).toHaveBeenCalled();
      expect(result.content[0].text).toContain("false"); // no errors
    });

    it("executes bulk delete operations", async () => {
      vi.mocked(mockES.bulk).mockResolvedValue({ errors: false, items: [{ delete: { result: "deleted" } }] });
      const tool = tools.find((t) => t.definition.name === "bulk")!;
      await tool.handler({
        operations: [{ action: "delete", index: "test", id: "to-delete" }],
      });
      expect(mockES.bulk).toHaveBeenCalled();
    });
  });

  describe("list_indices", () => {
    it("lists indices with stats", async () => {
      vi.mocked(mockES.indices.stats).mockResolvedValue({
        indices: {
          "test-index": {
            primaries: { docs: { count: 42 }, store: { size_in_bytes: 1024 } },
          },
        },
      });
      const tool = tools.find((t) => t.definition.name === "list_indices")!;
      const result = await tool.handler({});
      expect(result.content[0].text).toContain("test-index");
      expect(result.content[0].text).toContain("42");
    });
  });

  describe("create_index", () => {
    it("creates a new index", async () => {
      vi.mocked(mockES.indices.exists).mockResolvedValue(false);
      vi.mocked(mockES.indices.create).mockResolvedValue({ acknowledged: true });
      const tool = tools.find((t) => t.definition.name === "create_index")!;
      const result = await tool.handler({ index: "new-index" });
      expect(mockES.indices.create).toHaveBeenCalled();
      expect(result.content[0].text).toContain("acknowledged");
    });

    it("skips creation if index exists", async () => {
      vi.mocked(mockES.indices.exists).mockResolvedValue(true);
      const tool = tools.find((t) => t.definition.name === "create_index")!;
      const result = await tool.handler({ index: "existing" });
      expect(mockES.indices.create).not.toHaveBeenCalled();
      expect(result.content[0].text).toContain("already exists");
    });
  });

  describe("delete_index", () => {
    it("deletes an index", async () => {
      vi.mocked(mockES.indices.delete).mockResolvedValue({ acknowledged: true });
      const tool = tools.find((t) => t.definition.name === "delete_index")!;
      const result = await tool.handler({ index: "old-index" });
      expect(mockES.indices.delete).toHaveBeenCalledWith({ index: "old-index" });
      expect(result.content[0].text).toContain("acknowledged");
    });
  });

  describe("index_mapping", () => {
    it("returns index mapping", async () => {
      vi.mocked(mockES.indices.getMapping).mockResolvedValue({
        "test-index": { mappings: { properties: { title: { type: "text" } } } },
      });
      const tool = tools.find((t) => t.definition.name === "index_mapping")!;
      const result = await tool.handler({ index: "test-index" });
      expect(result.content[0].text).toContain("text");
    });
  });

  describe("count", () => {
    it("counts all documents", async () => {
      vi.mocked(mockES.count).mockResolvedValue({ count: 100 });
      const tool = tools.find((t) => t.definition.name === "count")!;
      const result = await tool.handler({ index: "test" });
      expect(mockES.count).toHaveBeenCalledWith({ index: "test" });
      expect(result.content[0].text).toContain("100");
    });

    it("counts with query filter", async () => {
      vi.mocked(mockES.count).mockResolvedValue({ count: 5 });
      const tool = tools.find((t) => t.definition.name === "count")!;
      await tool.handler({ index: "test", query: { term: { status: "active" } } });
      expect(mockES.count).toHaveBeenCalledWith({
        index: "test",
        body: { query: { term: { status: "active" } } },
      });
    });
  });

  describe("cluster_health", () => {
    it("returns cluster health", async () => {
      vi.mocked(mockES.cluster.health).mockResolvedValue({
        cluster_name: "test-cluster",
        status: "green",
        number_of_nodes: 3,
      });
      const tool = tools.find((t) => t.definition.name === "cluster_health")!;
      const result = await tool.handler({});
      expect(result.content[0].text).toContain("green");
      expect(result.content[0].text).toContain("test-cluster");
    });
  });

  describe("error handling", () => {
    it("returns error when search fails", async () => {
      vi.mocked(mockES.search).mockRejectedValue(new Error("Connection refused"));
      const tool = tools.find((t) => t.definition.name === "search")!;
      const result = await tool.handler({ index: "test" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Connection refused");
    });

    it("returns error when index operation fails", async () => {
      vi.mocked(mockES.index).mockRejectedValue(new Error("Mapping error"));
      const tool = tools.find((t) => t.definition.name === "index_document")!;
      const result = await tool.handler({ index: "test", document: {} });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Mapping error");
    });
  });
});
