import type { ElasticsearchClient } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createElasticsearchTools(client: ElasticsearchClient): McpTool[] {
  const searchTool: McpTool = {
    definition: {
      name: "search",
      description:
        "Search documents in an Elasticsearch index using Query DSL. Returns matching documents with scores and highlights.",
      inputSchema: {
        type: "object",
        properties: {
          index: { type: "string", description: "Index name to search" },
          query: { type: "object", description: "Elasticsearch Query DSL body (e.g. { match: { title: \"hello\" } })" },
          size: { type: "number", description: "Max results to return (default: 10)" },
          from: { type: "number", description: "Offset for pagination (default: 0)" },
          sort: { type: "array", description: "Sort specification (e.g. [{ created_at: \"desc\" }])" },
        },
        required: ["index"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const body: Record<string, unknown> = {
            query: (args.query as object) ?? { match_all: {} },
            size: (args.size as number) ?? 10,
            from: (args.from as number) ?? 0,
          };
          if (args.sort) body.sort = args.sort;
          const resp = await client.search({ index: args.index as string, body });
          const total = typeof resp.hits.total === "object" ? (resp.hits.total as { value: number }).value : resp.hits.total;
          return { total, hits: resp.hits.hits };
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const indexTool: McpTool = {
    definition: {
      name: "index_document",
      description: "Index (create or update) a document in Elasticsearch. Returns the document ID and operation result.",
      inputSchema: {
        type: "object",
        properties: {
          index: { type: "string", description: "Index name" },
          document: { type: "object", description: "Document body to index" },
          id: { type: "string", description: "Document ID (optional, auto-generated if omitted)" },
        },
        required: ["index", "document"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const resp = await client.index({
            index: args.index as string,
            id: args.id as string | undefined,
            body: args.document as object,
            refresh: "wait_for",
          });
          return { _id: resp._id, result: resp.result };
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const getTool: McpTool = {
    definition: {
      name: "get_document",
      description: "Get a document by ID from an Elasticsearch index. Returns the document source.",
      inputSchema: {
        type: "object",
        properties: {
          index: { type: "string", description: "Index name" },
          id: { type: "string", description: "Document ID" },
        },
        required: ["index", "id"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const resp = await client.get({ index: args.index as string, id: args.id as string });
          if (!resp.found) return { found: false, message: `Document ${args.id} not found` };
          return { found: true, _id: resp._id, _source: resp._source };
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const deleteTool: McpTool = {
    definition: {
      name: "delete_document",
      description: "Delete a document by ID from an Elasticsearch index.",
      inputSchema: {
        type: "object",
        properties: {
          index: { type: "string", description: "Index name" },
          id: { type: "string", description: "Document ID to delete" },
        },
        required: ["index", "id"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const resp = await client.delete({
            index: args.index as string,
            id: args.id as string,
            refresh: "wait_for",
          });
          return { _id: resp._id, result: resp.result };
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const bulkTool: McpTool = {
    definition: {
      name: "bulk",
      description:
        "Execute bulk operations (index, update, delete) in a single request. Significantly faster for multiple documents.",
      inputSchema: {
        type: "object",
        properties: {
          operations: {
            type: "array",
            description:
              "Array of operations. Each item is { action: \"index\"|\"delete\", index: string, id?: string, document?: object }",
          },
        },
        required: ["operations"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const ops = args.operations as Array<{
            action: "index" | "delete";
            index: string;
            id?: string;
            document?: object;
          }>;
          const body: unknown[] = [];
          for (const op of ops) {
            if (op.action === "index") {
              body.push({ index: { _index: op.index, _id: op.id } });
              body.push(op.document ?? {});
            } else if (op.action === "delete") {
              body.push({ delete: { _index: op.index, _id: op.id } });
            }
          }
          const resp = await client.bulk({ body, refresh: "wait_for" });
          return { errors: resp.errors, items_count: resp.items.length };
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const listIndicesTool: McpTool = {
    definition: {
      name: "list_indices",
      description: "List all indices in the Elasticsearch cluster with their document counts and storage sizes.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () => {
      return safeRun(
        async () => {
          const stats = await client.indices.stats({ index: "*" });
          const indices = (stats as Record<string, unknown>).indices as Record<string, unknown> | undefined;
          if (!indices) return [];
          return Object.entries(indices).map(([name, info]) => {
            const stats = (info as Record<string, unknown>).primaries as Record<string, unknown> | undefined;
            const docs = stats?.docs as Record<string, number> | undefined;
            const store = stats?.store as Record<string, number> | undefined;
            return {
              index: name,
              docs_count: docs?.count ?? 0,
              size_bytes: store?.size_in_bytes ?? 0,
            };
          });
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const createIndexTool: McpTool = {
    definition: {
      name: "create_index",
      description: "Create a new Elasticsearch index with optional mapping and settings.",
      inputSchema: {
        type: "object",
        properties: {
          index: { type: "string", description: "Index name" },
          mappings: { type: "object", description: "Index mappings (optional)" },
          settings: { type: "object", description: "Index settings (optional, e.g. { number_of_shards: 1 })" },
        },
        required: ["index"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const exists = await client.indices.exists({ index: args.index as string });
          if (exists) return { acknowledged: true, message: `Index ${args.index} already exists` };
          const body: Record<string, unknown> = {};
          if (args.mappings) body.mappings = args.mappings;
          if (args.settings) body.settings = args.settings;
          const resp = await client.indices.create({ index: args.index as string, body: Object.keys(body).length > 0 ? body : undefined });
          return { acknowledged: resp.acknowledged, index: args.index };
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const deleteIndexTool: McpTool = {
    definition: {
      name: "delete_index",
      description: "Delete an Elasticsearch index. WARNING: This permanently deletes all data in the index.",
      inputSchema: {
        type: "object",
        properties: {
          index: { type: "string", description: "Index name to delete" },
        },
        required: ["index"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const resp = await client.indices.delete({ index: args.index as string });
          return { acknowledged: resp.acknowledged, deleted: args.index };
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const indexMappingTool: McpTool = {
    definition: {
      name: "index_mapping",
      description: "Get the mapping (schema) of an Elasticsearch index.",
      inputSchema: {
        type: "object",
        properties: {
          index: { type: "string", description: "Index name" },
        },
        required: ["index"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          return await client.indices.getMapping({ index: args.index as string });
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const countTool: McpTool = {
    definition: {
      name: "count",
      description: "Count documents in an Elasticsearch index, optionally with a query filter.",
      inputSchema: {
        type: "object",
        properties: {
          index: { type: "string", description: "Index name" },
          query: { type: "object", description: "Query DSL body (optional, defaults to match_all)" },
        },
        required: ["index"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const params: { index: string; body?: unknown } = { index: args.index as string };
          if (args.query) params.body = { query: args.query };
          const resp = await client.count(params);
          return { count: resp.count };
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const clusterHealthTool: McpTool = {
    definition: {
      name: "cluster_health",
      description: "Get Elasticsearch cluster health status (green/yellow/red), node count, and shard info.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () => {
      return safeRun(
        async () => {
          return await client.cluster.health();
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  return [
    searchTool,
    indexTool,
    getTool,
    deleteTool,
    bulkTool,
    listIndicesTool,
    createIndexTool,
    deleteIndexTool,
    indexMappingTool,
    countTool,
    clusterHealthTool,
  ];
}
