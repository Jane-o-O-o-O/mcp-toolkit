import { describe, it, expect, vi } from "vitest";
import { createNeo4jTools } from "../src/tools/index.js";
import type { Neo4jClient } from "../src/tools/types.js";

function mockNeo4jClient(overrides: Partial<Neo4jClient> = {}): Neo4jClient {
  return {
    executeQuery: vi.fn().mockResolvedValue({
      columns: ["n"],
      data: [{ row: [{ name: "Alice" }], meta: [null] }],
    }),
    listNodes: vi.fn().mockResolvedValue({
      columns: ["n"],
      data: [
        { row: [{ name: "Alice", age: 30 }] },
        { row: [{ name: "Bob", age: 25 }] },
      ],
    }),
    createNode: vi.fn().mockResolvedValue({
      columns: ["n"],
      data: [{ row: [{ name: "Charlie", age: 35 }] }],
    }),
    createRelationship: vi.fn().mockResolvedValue({
      columns: ["r"],
      data: [{ row: [{ type: "KNOWS", since: 2024 }] }],
    }),
    getNode: vi.fn().mockResolvedValue({
      columns: ["n"],
      data: [{ row: [{ name: "Alice", age: 30 }] }],
    }),
    updateNode: vi.fn().mockResolvedValue({
      columns: ["n"],
      data: [{ row: [{ name: "Alice", age: 31 }] }],
    }),
    deleteNode: vi.fn().mockResolvedValue({
      columns: ["deleted"],
      data: [{ row: [1] }],
    }),
    listLabels: vi.fn().mockResolvedValue({
      columns: ["label"],
      data: [
        { row: ["Person"] },
        { row: ["Company"] },
      ],
    }),
    ...overrides,
  };
}

describe("Neo4j tools", () => {
  it("should have 8 tools", () => {
    const tools = createNeo4jTools(mockNeo4jClient());
    expect(tools).toHaveLength(8);
  });

  describe("neo4j_execute_query", () => {
    it("should execute a Cypher query", async () => {
      const client = mockNeo4jClient();
      const tools = createNeo4jTools(client);
      const tool = tools.find((t) => t.definition.name === "neo4j_execute_query")!;

      const result = await tool.handler({ query: "MATCH (n) RETURN n LIMIT 1" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Alice");
      expect(client.executeQuery).toHaveBeenCalledWith("MATCH (n) RETURN n LIMIT 1", undefined);
    });

    it("should pass parameters to executeQuery", async () => {
      const client = mockNeo4jClient();
      const tools = createNeo4jTools(client);
      const tool = tools.find((t) => t.definition.name === "neo4j_execute_query")!;

      const result = await tool.handler({
        query: "MATCH (n) WHERE n.name = $name RETURN n",
        parameters: { name: "Alice" },
      });
      expect(result.isError).toBeUndefined();
      expect(client.executeQuery).toHaveBeenCalledWith(
        "MATCH (n) WHERE n.name = $name RETURN n",
        { name: "Alice" },
      );
    });
  });

  describe("neo4j_list_nodes", () => {
    it("should list nodes by label", async () => {
      const client = mockNeo4jClient();
      const tools = createNeo4jTools(client);
      const tool = tools.find((t) => t.definition.name === "neo4j_list_nodes")!;

      const result = await tool.handler({ label: "Person", limit: 5 });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Alice");
      expect(result.content[0].text).toContain("Bob");
      expect(client.listNodes).toHaveBeenCalledWith("Person", 5);
    });
  });

  describe("neo4j_create_node", () => {
    it("should create a node with label and properties", async () => {
      const client = mockNeo4jClient();
      const tools = createNeo4jTools(client);
      const tool = tools.find((t) => t.definition.name === "neo4j_create_node")!;

      const result = await tool.handler({
        label: "Person",
        properties: { name: "Charlie", age: 35 },
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Charlie");
      expect(client.createNode).toHaveBeenCalledWith("Person", { name: "Charlie", age: 35 });
    });
  });

  describe("neo4j_create_relationship", () => {
    it("should create a relationship between two nodes", async () => {
      const client = mockNeo4jClient();
      const tools = createNeo4jTools(client);
      const tool = tools.find((t) => t.definition.name === "neo4j_create_relationship")!;

      const result = await tool.handler({
        fromNodeId: 1,
        toNodeId: 2,
        relationshipType: "KNOWS",
        properties: { since: 2024 },
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("KNOWS");
      expect(client.createRelationship).toHaveBeenCalledWith(1, 2, "KNOWS", { since: 2024 });
    });
  });

  describe("neo4j_get_node", () => {
    it("should get a node by ID", async () => {
      const client = mockNeo4jClient();
      const tools = createNeo4jTools(client);
      const tool = tools.find((t) => t.definition.name === "neo4j_get_node")!;

      const result = await tool.handler({ nodeId: 1 });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Alice");
      expect(client.getNode).toHaveBeenCalledWith(1);
    });
  });

  describe("neo4j_update_node", () => {
    it("should update node properties", async () => {
      const client = mockNeo4jClient();
      const tools = createNeo4jTools(client);
      const tool = tools.find((t) => t.definition.name === "neo4j_update_node")!;

      const result = await tool.handler({ nodeId: 1, properties: { age: 31 } });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("31");
      expect(client.updateNode).toHaveBeenCalledWith(1, { age: 31 });
    });
  });

  describe("neo4j_delete_node", () => {
    it("should delete a node by ID", async () => {
      const client = mockNeo4jClient();
      const tools = createNeo4jTools(client);
      const tool = tools.find((t) => t.definition.name === "neo4j_delete_node")!;

      const result = await tool.handler({ nodeId: 1 });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("1");
      expect(client.deleteNode).toHaveBeenCalledWith(1);
    });
  });

  describe("neo4j_list_labels", () => {
    it("should list all labels", async () => {
      const client = mockNeo4jClient();
      const tools = createNeo4jTools(client);
      const tool = tools.find((t) => t.definition.name === "neo4j_list_labels")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Person");
      expect(result.content[0].text).toContain("Company");
      expect(client.listLabels).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should return error on API failure", async () => {
      const client = mockNeo4jClient({
        executeQuery: vi.fn().mockRejectedValue(new Error("Connection refused")),
      });
      const tools = createNeo4jTools(client);
      const tool = tools.find((t) => t.definition.name === "neo4j_execute_query")!;

      const result = await tool.handler({ query: "MATCH (n) RETURN n" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Connection refused");
    });

    it("should return error on query error", async () => {
      const client = mockNeo4jClient({
        listNodes: vi.fn().mockRejectedValue(new Error("Neo4j error: Invalid label")),
      });
      const tools = createNeo4jTools(client);
      const tool = tools.find((t) => t.definition.name === "neo4j_list_nodes")!;

      const result = await tool.handler({ label: "InvalidLabel" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Invalid label");
    });
  });
});
