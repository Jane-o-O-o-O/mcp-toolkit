import type { NotionClient } from "./types.js";
import type { Block, SortParam } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createNotionTools(notion: NotionClient): McpTool[] {
  const searchTool: McpTool = {
    definition: {
      name: "search",
      description: "Search Notion pages and databases by query string.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          filter_type: { type: "string", enum: ["page", "database"], description: "Filter by object type" },
        },
        required: ["query"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const filter = args.filter_type ? { type: args.filter_type as "page" | "database" } : undefined;
          return await notion.search(args.query as string, filter);
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const listPagesTool: McpTool = {
    definition: {
      name: "list_pages",
      description: "List pages in a Notion database. Returns page ID, title, URL, and timestamps.",
      inputSchema: {
        type: "object",
        properties: {
          database_id: { type: "string", description: "Notion database ID" },
          page_size: { type: "number", description: "Max number of pages to return (default: 100)" },
        },
        required: ["database_id"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          return await notion.listPages(args.database_id as string);
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const getPageTool: McpTool = {
    definition: {
      name: "get_page",
      description: "Get a Notion page by ID including all its properties.",
      inputSchema: {
        type: "object",
        properties: {
          page_id: { type: "string", description: "Notion page ID" },
        },
        required: ["page_id"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          return await notion.getPage(args.page_id as string);
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const createPageTool: McpTool = {
    definition: {
      name: "create_page",
      description: "Create a new page in a database or as a child of another page.",
      inputSchema: {
        type: "object",
        properties: {
          parent_type: { type: "string", enum: ["database_id", "page_id"], description: "Parent type" },
          parent_id: { type: "string", description: "Parent database or page ID" },
          properties: { type: "object", description: "Page properties (title is required for databases)" },
          children: { type: "array", description: "Initial block children" },
        },
        required: ["parent_type", "parent_id", "properties"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          return await notion.createPage(
            { type: args.parent_type as "database_id" | "page_id", id: args.parent_id as string },
            args.properties as Record<string, unknown>,
            args.children as Block[] | undefined,
          );
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const updatePageTool: McpTool = {
    definition: {
      name: "update_page",
      description: "Update properties of an existing Notion page.",
      inputSchema: {
        type: "object",
        properties: {
          page_id: { type: "string", description: "Notion page ID" },
          properties: { type: "object", description: "Properties to update" },
        },
        required: ["page_id", "properties"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          return await notion.updatePage(
            args.page_id as string,
            args.properties as Record<string, unknown>,
          );
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const getDatabaseTool: McpTool = {
    definition: {
      name: "get_database",
      description: "Get a Notion database schema including property names and types.",
      inputSchema: {
        type: "object",
        properties: {
          database_id: { type: "string", description: "Notion database ID" },
        },
        required: ["database_id"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          return await notion.getDatabase(args.database_id as string);
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const queryDatabaseTool: McpTool = {
    definition: {
      name: "query_database",
      description: "Query a Notion database with optional filter and sort.",
      inputSchema: {
        type: "object",
        properties: {
          database_id: { type: "string", description: "Notion database ID" },
          filter: { type: "object", description: "Notion filter object (see Notion API docs)" },
          sorts: { type: "array", description: "Sort parameters" },
          page_size: { type: "number", description: "Max results per page (default: 100)" },
        },
        required: ["database_id"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          return await notion.queryDatabase(
            args.database_id as string,
            args.filter as Record<string, unknown> | undefined,
            args.sorts as SortParam[] | undefined,
            args.page_size as number | undefined,
          );
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const getBlockChildrenTool: McpTool = {
    definition: {
      name: "get_block_children",
      description: "Get child blocks of a page or block. Useful for reading page content.",
      inputSchema: {
        type: "object",
        properties: {
          block_id: { type: "string", description: "Block or page ID" },
          page_size: { type: "number", description: "Max blocks to return (default: 100)" },
        },
        required: ["block_id"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          return await notion.getBlockChildren(
            args.block_id as string,
            args.page_size as number | undefined,
          );
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const appendBlockChildrenTool: McpTool = {
    definition: {
      name: "append_block_children",
      description: "Append new blocks (paragraphs, headings, lists, etc.) to a page or block.",
      inputSchema: {
        type: "object",
        properties: {
          block_id: { type: "string", description: "Parent block or page ID" },
          children: { type: "array", description: "Array of block objects to append" },
        },
        required: ["block_id", "children"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          return await notion.appendBlockChildren(
            args.block_id as string,
            args.children as Block[],
          );
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  return [
    searchTool,
    listPagesTool,
    getPageTool,
    createPageTool,
    updatePageTool,
    getDatabaseTool,
    queryDatabaseTool,
    getBlockChildrenTool,
    appendBlockChildrenTool,
  ];
}


