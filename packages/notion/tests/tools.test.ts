import { describe, it, expect, vi } from "vitest";
import { createNotionTools } from "../src/tools/index.js";
import type { NotionClient } from "../src/tools/types.js";

function mockNotionClient(overrides: Partial<NotionClient> = {}): NotionClient {
  return {
    search: vi.fn().mockResolvedValue([
      { object: "page", id: "page-1", title: "My Notes", url: "https://notion.so/page-1", lastEditedTime: "2026-05-14T10:00:00Z" },
    ]),
    listPages: vi.fn().mockResolvedValue([
      { id: "page-1", title: "Task 1", url: "https://notion.so/page-1", createdTime: "2026-05-01T00:00:00Z", lastEditedTime: "2026-05-14T10:00:00Z" },
      { id: "page-2", title: "Task 2", url: "https://notion.so/page-2", createdTime: "2026-05-02T00:00:00Z", lastEditedTime: "2026-05-13T08:00:00Z" },
    ]),
    getPage: vi.fn().mockResolvedValue({
      id: "page-1",
      title: "My Notes",
      url: "https://notion.so/page-1",
      properties: { Name: { type: "title", title: [{ plain_text: "My Notes" }] } },
      createdTime: "2026-05-01T00:00:00Z",
      lastEditedTime: "2026-05-14T10:00:00Z",
    }),
    createPage: vi.fn().mockResolvedValue({
      id: "new-page-1",
      url: "https://notion.so/new-page-1",
      createdTime: "2026-05-14T12:00:00Z",
    }),
    updatePage: vi.fn().mockResolvedValue({
      id: "page-1",
      url: "https://notion.so/page-1",
      lastEditedTime: "2026-05-14T13:00:00Z",
    }),
    getDatabase: vi.fn().mockResolvedValue({
      id: "db-1",
      title: "Tasks",
      properties: {
        Name: { type: "title" },
        Status: { type: "select" },
        Priority: { type: "number" },
      },
      url: "https://notion.so/db-1",
    }),
    queryDatabase: vi.fn().mockResolvedValue({
      pages: [
        { id: "page-1", title: "Task 1", url: "https://notion.so/page-1", createdTime: "2026-05-01", lastEditedTime: "2026-05-14" },
      ],
      hasMore: false,
      nextCursor: null,
    }),
    getBlockChildren: vi.fn().mockResolvedValue({
      blocks: [
        { object: "block", type: "paragraph", id: "block-1" },
        { object: "block", type: "heading_2", id: "block-2" },
      ],
      hasMore: false,
      nextCursor: null,
    }),
    appendBlockChildren: vi.fn().mockResolvedValue({ blockCount: 2 }),
    ...overrides,
  };
}

describe("Notion tools", () => {
  it("should have 9 tools", () => {
    const tools = createNotionTools(mockNotionClient());
    expect(tools).toHaveLength(9);
  });

  describe("search", () => {
    it("should search pages", async () => {
      const client = mockNotionClient();
      const tools = createNotionTools(client);
      const tool = tools.find((t) => t.definition.name === "search")!;

      const result = await tool.handler({ query: "notes" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("My Notes");
      expect(client.search).toHaveBeenCalledWith("notes", undefined);
    });

    it("should search with type filter", async () => {
      const client = mockNotionClient();
      const tools = createNotionTools(client);
      const tool = tools.find((t) => t.definition.name === "search")!;

      await tool.handler({ query: "notes", filter_type: "page" });
      expect(client.search).toHaveBeenCalledWith("notes", { type: "page" });
    });
  });

  describe("list_pages", () => {
    it("should list pages in a database", async () => {
      const client = mockNotionClient();
      const tools = createNotionTools(client);
      const tool = tools.find((t) => t.definition.name === "list_pages")!;

      const result = await tool.handler({ database_id: "db-1" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Task 1");
      expect(result.content[0].text).toContain("Task 2");
    });
  });

  describe("get_page", () => {
    it("should get a page by id", async () => {
      const client = mockNotionClient();
      const tools = createNotionTools(client);
      const tool = tools.find((t) => t.definition.name === "get_page")!;

      const result = await tool.handler({ page_id: "page-1" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("My Notes");
      expect(client.getPage).toHaveBeenCalledWith("page-1");
    });
  });

  describe("create_page", () => {
    it("should create a page", async () => {
      const client = mockNotionClient();
      const tools = createNotionTools(client);
      const tool = tools.find((t) => t.definition.name === "create_page")!;

      const result = await tool.handler({
        parent_type: "database_id",
        parent_id: "db-1",
        properties: { Name: { title: [{ text: { content: "New Task" } }] } },
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("new-page-1");
    });
  });

  describe("update_page", () => {
    it("should update page properties", async () => {
      const client = mockNotionClient();
      const tools = createNotionTools(client);
      const tool = tools.find((t) => t.definition.name === "update_page")!;

      const result = await tool.handler({
        page_id: "page-1",
        properties: { Status: { select: { name: "Done" } } },
      });
      expect(result.isError).toBeUndefined();
      expect(client.updatePage).toHaveBeenCalledWith("page-1", { Status: { select: { name: "Done" } } });
    });
  });

  describe("get_database", () => {
    it("should get database schema", async () => {
      const client = mockNotionClient();
      const tools = createNotionTools(client);
      const tool = tools.find((t) => t.definition.name === "get_database")!;

      const result = await tool.handler({ database_id: "db-1" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Tasks");
      expect(result.content[0].text).toContain("select");
    });
  });

  describe("query_database", () => {
    it("should query a database", async () => {
      const client = mockNotionClient();
      const tools = createNotionTools(client);
      const tool = tools.find((t) => t.definition.name === "query_database")!;

      const result = await tool.handler({ database_id: "db-1" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Task 1");
    });
  });

  describe("get_block_children", () => {
    it("should get block children", async () => {
      const client = mockNotionClient();
      const tools = createNotionTools(client);
      const tool = tools.find((t) => t.definition.name === "get_block_children")!;

      const result = await tool.handler({ block_id: "page-1" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("paragraph");
      expect(result.content[0].text).toContain("heading_2");
    });
  });

  describe("append_block_children", () => {
    it("should append blocks", async () => {
      const client = mockNotionClient();
      const tools = createNotionTools(client);
      const tool = tools.find((t) => t.definition.name === "append_block_children")!;

      const result = await tool.handler({
        block_id: "page-1",
        children: [
          { type: "paragraph", paragraph: { rich_text: [{ text: { content: "Hello" } }] } },
        ],
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("blockCount");
    });
  });

  describe("error handling", () => {
    it("should return error on API failure", async () => {
      const client = mockNotionClient({
        search: vi.fn().mockRejectedValue(new Error("Unauthorized")),
      });
      const tools = createNotionTools(client);
      const tool = tools.find((t) => t.definition.name === "search")!;

      const result = await tool.handler({ query: "test" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unauthorized");
    });
  });
});
