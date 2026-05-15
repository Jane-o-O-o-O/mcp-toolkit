import type { Neo4jClient } from "./tools/types.js";
import { createNeo4jTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type Neo4jConfig } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  neo4j: Neo4jClient;
  logger: Logger;
  config: Neo4jConfig;
}

function createNeo4jClient(config: Neo4jConfig): Neo4jClient {
  const { url, user, password, database } = config;
  const baseUrl = `${url}/db/${database}/tx/commit`;
  const authHeader = `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;

  async function neo4jRequest(
    statements: Array<{ statement: string; parameters?: Record<string, unknown> }>,
  ): Promise<{ results: Array<{ columns: string[]; data: Array<{ row: unknown[]; meta?: unknown[] }> }>; errors?: Array<{ code: string; message: string }> }> {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ statements }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Neo4j API error (${response.status}): ${errorBody}`);
    }

    return response.json() as Promise<{
      results: Array<{ columns: string[]; data: Array<{ row: unknown[]; meta?: unknown[] }> }>;
      errors?: Array<{ code: string; message: string }>;
    }>;
  }

  return {
    async executeQuery(query, parameters) {
      const result = await neo4jRequest([{ statement: query, parameters }]);
      if (result.errors && result.errors.length > 0) {
        throw new Error(`Neo4j error: ${result.errors.map((e) => e.message).join(", ")}`);
      }
      const first = result.results[0];
      return { columns: first?.columns, data: first?.data ?? [], errors: [] };
    },

    async listNodes(label, limit = 10) {
      const result = await neo4jRequest([
        {
          statement: `MATCH (n:\`${label}\`) RETURN n LIMIT $limit`,
          parameters: { limit },
        },
      ]);
      if (result.errors && result.errors.length > 0) {
        throw new Error(`Neo4j error: ${result.errors.map((e) => e.message).join(", ")}`);
      }
      const first = result.results[0];
      return { columns: first?.columns, data: first?.data ?? [], errors: [] };
    },

    async createNode(label, properties = {}) {
      const result = await neo4jRequest([
        {
          statement: `CREATE (n:\`${label}\` $props) RETURN n`,
          parameters: { props: properties },
        },
      ]);
      if (result.errors && result.errors.length > 0) {
        throw new Error(`Neo4j error: ${result.errors.map((e) => e.message).join(", ")}`);
      }
      const first = result.results[0];
      return { columns: first?.columns, data: first?.data ?? [], errors: [] };
    },

    async createRelationship(fromNodeId, toNodeId, relationshipType, properties = {}) {
      const result = await neo4jRequest([
        {
          statement: `MATCH (a) WHERE id(a) = $fromId MATCH (b) WHERE id(b) = $toId CREATE (a)-[r:\`${relationshipType}\` $props]->(b) RETURN r`,
          parameters: { fromId: fromNodeId, toId: toNodeId, props: properties },
        },
      ]);
      if (result.errors && result.errors.length > 0) {
        throw new Error(`Neo4j error: ${result.errors.map((e) => e.message).join(", ")}`);
      }
      const first = result.results[0];
      return { columns: first?.columns, data: first?.data ?? [], errors: [] };
    },

    async getNode(nodeId) {
      const result = await neo4jRequest([
        {
          statement: "MATCH (n) WHERE id(n) = $nodeId RETURN n",
          parameters: { nodeId },
        },
      ]);
      if (result.errors && result.errors.length > 0) {
        throw new Error(`Neo4j error: ${result.errors.map((e) => e.message).join(", ")}`);
      }
      const first = result.results[0];
      return { columns: first?.columns, data: first?.data ?? [], errors: [] };
    },

    async updateNode(nodeId, properties) {
      const result = await neo4jRequest([
        {
          statement: "MATCH (n) WHERE id(n) = $nodeId SET n += $props RETURN n",
          parameters: { nodeId, props: properties },
        },
      ]);
      if (result.errors && result.errors.length > 0) {
        throw new Error(`Neo4j error: ${result.errors.map((e) => e.message).join(", ")}`);
      }
      const first = result.results[0];
      return { columns: first?.columns, data: first?.data ?? [], errors: [] };
    },

    async deleteNode(nodeId) {
      const result = await neo4jRequest([
        {
          statement: "MATCH (n) WHERE id(n) = $nodeId DETACH DELETE n RETURN count(n) as deleted",
          parameters: { nodeId },
        },
      ]);
      if (result.errors && result.errors.length > 0) {
        throw new Error(`Neo4j error: ${result.errors.map((e) => e.message).join(", ")}`);
      }
      const first = result.results[0];
      return { columns: first?.columns, data: first?.data ?? [], errors: [] };
    },

    async listLabels() {
      const result = await neo4jRequest([
        { statement: "CALL db.labels() YIELD label RETURN label" },
      ]);
      if (result.errors && result.errors.length > 0) {
        throw new Error(`Neo4j error: ${result.errors.map((e) => e.message).join(", ")}`);
      }
      const first = result.results[0];
      return { columns: first?.columns, data: first?.data ?? [], errors: [] };
    },
  };
}

export async function createServerContext(config?: Partial<Neo4jConfig>): Promise<ServerContext> {
  const fullConfig = config?.url
    ? {
        url: config.url,
        user: config.user ?? "neo4j",
        password: config.password ?? "",
        database: config.database ?? "neo4j",
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({ name: "neo4j", level: fullConfig.logLevel });
  const neo4j = createNeo4jClient(fullConfig);
  const tools = createNeo4jTools(neo4j);
  const server = createMcpServer("@mcp-toolkit/neo4j", "0.1.0", tools, logger);

  return { server, neo4j, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "Neo4j", {
    transport: ctx.config.transport,
    port: ctx.config.port,
  });
}
