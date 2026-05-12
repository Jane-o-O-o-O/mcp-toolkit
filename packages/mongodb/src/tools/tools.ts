import type { MongoDBClient } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createMongoDBTools(mongo: MongoDBClient): McpTool[] {
  const listDatabasesTool: McpTool = {
    definition: {
      name: "list_databases",
      description: "List all databases on the MongoDB server.",
      inputSchema: { type: "object", properties: {} },
    },
    handler: async () => {
      return safeRun(
        async () => await mongo.listDatabases(),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const listCollectionsTool: McpTool = {
    definition: {
      name: "list_collections",
      description: "List all collections in a database.",
      inputSchema: {
        type: "object",
        properties: {
          database: { type: "string", description: "Database name" },
        },
        required: ["database"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => await mongo.listCollections(args.database as string),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const findTool: McpTool = {
    definition: {
      name: "find",
      description: "Query documents in a collection. Supports filter, sort, limit, and projection.",
      inputSchema: {
        type: "object",
        properties: {
          database: { type: "string", description: "Database name" },
          collection: { type: "string", description: "Collection name" },
          filter: { type: "object", description: "MongoDB query filter (JSON)" },
          limit: { type: "number", description: "Max documents to return (default: 50)" },
          sort: { type: "object", description: "Sort specification, e.g. { createdAt: -1 }" },
          projection: { type: "object", description: "Fields to include/exclude" },
        },
        required: ["database", "collection"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const filter = (args.filter as Record<string, unknown>) ?? {};
          const options: { limit?: number; sort?: Record<string, 1 | -1>; projection?: Record<string, 0 | 1> } = {};
          if (args.limit) options.limit = args.limit as number;
          if (args.sort) options.sort = args.sort as Record<string, 1 | -1>;
          if (args.projection) options.projection = args.projection as Record<string, 0 | 1>;
          const docs = await mongo.find(args.database as string, args.collection as string, filter, options);
          return { count: docs.length, documents: docs };
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const findOneTool: McpTool = {
    definition: {
      name: "find_one",
      description: "Find a single document matching the filter.",
      inputSchema: {
        type: "object",
        properties: {
          database: { type: "string", description: "Database name" },
          collection: { type: "string", description: "Collection name" },
          filter: { type: "object", description: "MongoDB query filter" },
        },
        required: ["database", "collection"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const filter = (args.filter as Record<string, unknown>) ?? {};
          return await mongo.findOne(args.database as string, args.collection as string, filter);
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const insertOneTool: McpTool = {
    definition: {
      name: "insert_one",
      description: "Insert a single document into a collection.",
      inputSchema: {
        type: "object",
        properties: {
          database: { type: "string", description: "Database name" },
          collection: { type: "string", description: "Collection name" },
          document: { type: "object", description: "Document to insert" },
        },
        required: ["database", "collection", "document"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => await mongo.insertOne(
          args.database as string,
          args.collection as string,
          args.document as Record<string, unknown>,
        ),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const insertManyTool: McpTool = {
    definition: {
      name: "insert_many",
      description: "Insert multiple documents into a collection.",
      inputSchema: {
        type: "object",
        properties: {
          database: { type: "string", description: "Database name" },
          collection: { type: "string", description: "Collection name" },
          documents: { type: "array", items: { type: "object" }, description: "Documents to insert" },
        },
        required: ["database", "collection", "documents"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => await mongo.insertMany(
          args.database as string,
          args.collection as string,
          args.documents as Record<string, unknown>[],
        ),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const updateOneTool: McpTool = {
    definition: {
      name: "update_one",
      description: "Update a single document matching the filter. Use MongoDB update operators like $set.",
      inputSchema: {
        type: "object",
        properties: {
          database: { type: "string", description: "Database name" },
          collection: { type: "string", description: "Collection name" },
          filter: { type: "object", description: "Filter to match document" },
          update: { type: "object", description: "Update operations, e.g. { $set: { name: \"new\" } }" },
        },
        required: ["database", "collection", "filter", "update"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => await mongo.updateOne(
          args.database as string,
          args.collection as string,
          args.filter as Record<string, unknown>,
          args.update as Record<string, unknown>,
        ),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const updateManyTool: McpTool = {
    definition: {
      name: "update_many",
      description: "Update all documents matching the filter.",
      inputSchema: {
        type: "object",
        properties: {
          database: { type: "string", description: "Database name" },
          collection: { type: "string", description: "Collection name" },
          filter: { type: "object", description: "Filter to match documents" },
          update: { type: "object", description: "Update operations" },
        },
        required: ["database", "collection", "filter", "update"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => await mongo.updateMany(
          args.database as string,
          args.collection as string,
          args.filter as Record<string, unknown>,
          args.update as Record<string, unknown>,
        ),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const deleteOneTool: McpTool = {
    definition: {
      name: "delete_one",
      description: "Delete a single document matching the filter.",
      inputSchema: {
        type: "object",
        properties: {
          database: { type: "string", description: "Database name" },
          collection: { type: "string", description: "Collection name" },
          filter: { type: "object", description: "Filter to match document" },
        },
        required: ["database", "collection", "filter"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => await mongo.deleteOne(
          args.database as string,
          args.collection as string,
          args.filter as Record<string, unknown>,
        ),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const deleteManyTool: McpTool = {
    definition: {
      name: "delete_many",
      description: "Delete all documents matching the filter.",
      inputSchema: {
        type: "object",
        properties: {
          database: { type: "string", description: "Database name" },
          collection: { type: "string", description: "Collection name" },
          filter: { type: "object", description: "Filter to match documents" },
        },
        required: ["database", "collection", "filter"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => await mongo.deleteMany(
          args.database as string,
          args.collection as string,
          args.filter as Record<string, unknown>,
        ),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const countTool: McpTool = {
    definition: {
      name: "count",
      description: "Count documents in a collection matching an optional filter.",
      inputSchema: {
        type: "object",
        properties: {
          database: { type: "string", description: "Database name" },
          collection: { type: "string", description: "Collection name" },
          filter: { type: "object", description: "Optional filter" },
        },
        required: ["database", "collection"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const filter = (args.filter as Record<string, unknown>) ?? {};
          return await mongo.count(args.database as string, args.collection as string, filter);
        },
        (r) => JSON.stringify({ count: r }, null, 2),
      );
    },
  };

  const aggregateTool: McpTool = {
    definition: {
      name: "aggregate",
      description: "Run an aggregation pipeline on a collection.",
      inputSchema: {
        type: "object",
        properties: {
          database: { type: "string", description: "Database name" },
          collection: { type: "string", description: "Collection name" },
          pipeline: { type: "array", items: { type: "object" }, description: "Aggregation pipeline stages" },
        },
        required: ["database", "collection", "pipeline"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const results = await mongo.aggregate(
            args.database as string,
            args.collection as string,
            args.pipeline as Record<string, unknown>[],
          );
          return { count: results.length, results };
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  return [
    listDatabasesTool, listCollectionsTool,
    findTool, findOneTool,
    insertOneTool, insertManyTool,
    updateOneTool, updateManyTool,
    deleteOneTool, deleteManyTool,
    countTool, aggregateTool,
  ];
}
