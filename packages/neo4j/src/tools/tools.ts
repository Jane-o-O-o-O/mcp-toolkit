import type { Neo4jClient } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createNeo4jTools(client: Neo4jClient): McpTool[] {
  const executeQueryTool: McpTool = {
    definition: {
      name: "neo4j_execute_query",
      description: "Execute a raw Cypher query against the Neo4j database.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Cypher query to execute" },
          parameters: {
            type: "object",
            description: "Optional query parameters as key-value pairs",
          },
        },
        required: ["query"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.executeQuery(
            args.query as string,
            args.parameters as Record<string, unknown> | undefined,
          ),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const listNodesTool: McpTool = {
    definition: {
      name: "neo4j_list_nodes",
      description: "List nodes by label from the Neo4j database.",
      inputSchema: {
        type: "object",
        properties: {
          label: { type: "string", description: "Node label to filter by" },
          limit: { type: "number", description: "Maximum number of nodes to return (default: 10)" },
        },
        required: ["label"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.listNodes(
            args.label as string,
            args.limit as number | undefined,
          ),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const createNodeTool: McpTool = {
    definition: {
      name: "neo4j_create_node",
      description: "Create a new node with a label and optional properties in Neo4j.",
      inputSchema: {
        type: "object",
        properties: {
          label: { type: "string", description: "Label for the new node" },
          properties: {
            type: "object",
            description: "Properties to set on the node as key-value pairs",
          },
        },
        required: ["label"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.createNode(
            args.label as string,
            args.properties as Record<string, unknown> | undefined,
          ),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const createRelationshipTool: McpTool = {
    definition: {
      name: "neo4j_create_relationship",
      description: "Create a relationship between two existing nodes in Neo4j.",
      inputSchema: {
        type: "object",
        properties: {
          fromNodeId: { type: "number", description: "ID of the source node" },
          toNodeId: { type: "number", description: "ID of the target node" },
          relationshipType: { type: "string", description: "Type of relationship (e.g. KNOWS, LIKES)" },
          properties: {
            type: "object",
            description: "Optional properties to set on the relationship",
          },
        },
        required: ["fromNodeId", "toNodeId", "relationshipType"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.createRelationship(
            args.fromNodeId as number,
            args.toNodeId as number,
            args.relationshipType as string,
            args.properties as Record<string, unknown> | undefined,
          ),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const getNodeTool: McpTool = {
    definition: {
      name: "neo4j_get_node",
      description: "Get a node by its internal ID from Neo4j.",
      inputSchema: {
        type: "object",
        properties: {
          nodeId: { type: "number", description: "Internal Neo4j node ID" },
        },
        required: ["nodeId"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.getNode(args.nodeId as number),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const updateNodeTool: McpTool = {
    definition: {
      name: "neo4j_update_node",
      description: "Set properties on an existing node in Neo4j.",
      inputSchema: {
        type: "object",
        properties: {
          nodeId: { type: "number", description: "Internal Neo4j node ID" },
          properties: {
            type: "object",
            description: "Properties to set on the node as key-value pairs",
          },
        },
        required: ["nodeId", "properties"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.updateNode(
            args.nodeId as number,
            args.properties as Record<string, unknown>,
          ),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const deleteNodeTool: McpTool = {
    definition: {
      name: "neo4j_delete_node",
      description: "Delete a node by its internal ID from Neo4j (DETACH DELETE removes relationships too).",
      inputSchema: {
        type: "object",
        properties: {
          nodeId: { type: "number", description: "Internal Neo4j node ID" },
        },
        required: ["nodeId"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.deleteNode(args.nodeId as number),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const listLabelsTool: McpTool = {
    definition: {
      name: "neo4j_list_labels",
      description: "List all node labels in the Neo4j database.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async (_args) =>
      safeRun(
        async () => client.listLabels(),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  return [
    executeQueryTool,
    listNodesTool,
    createNodeTool,
    createRelationshipTool,
    getNodeTool,
    updateNodeTool,
    deleteNodeTool,
    listLabelsTool,
  ];
}
