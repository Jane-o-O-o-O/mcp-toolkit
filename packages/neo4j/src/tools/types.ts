/** Neo4j client interface for testability */
export interface Neo4jClient {
  executeQuery(query: string, parameters?: Record<string, unknown>): Promise<Neo4jQueryResult>;
  listNodes(label: string, limit?: number): Promise<Neo4jQueryResult>;
  createNode(label: string, properties?: Record<string, unknown>): Promise<Neo4jQueryResult>;
  createRelationship(
    fromNodeId: number,
    toNodeId: number,
    relationshipType: string,
    properties?: Record<string, unknown>,
  ): Promise<Neo4jQueryResult>;
  getNode(nodeId: number): Promise<Neo4jQueryResult>;
  updateNode(nodeId: number, properties: Record<string, unknown>): Promise<Neo4jQueryResult>;
  deleteNode(nodeId: number): Promise<Neo4jQueryResult>;
  listLabels(): Promise<Neo4jQueryResult>;
}

export interface Neo4jQueryResult {
  columns?: string[];
  data: Array<{ row: unknown[]; meta?: unknown[] }>;
  errors?: Array<{ code: string; message: string }>;
}

export interface Neo4jNode {
  nodeId: number;
  labels: string[];
  properties: Record<string, unknown>;
}
