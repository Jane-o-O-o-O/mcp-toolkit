import { Pool, type QueryResult } from "pg";

/** Abstraction over pg.Pool for testability */
export interface PostgresClient {
  query(text: string, params?: unknown[]): Promise<QueryResult>;
  end(): Promise<void>;
}

/** Create a real pg.Pool client */
export function createPgClient(connectionString: string, max?: number): PostgresClient {
  const pool = new Pool({ connectionString, max });
  return {
    query: (text, params) => pool.query(text, params as unknown[]),
    end: () => pool.end(),
  };
}
