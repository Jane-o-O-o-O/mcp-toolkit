/** MySQL client interface for testability */
export interface MySQLClient {
  query(sql: string, params?: unknown[]): Promise<[MySQLRow[], MySQLField[]]>;
  end(): Promise<void>;
  ping(): Promise<void>;
}

export interface MySQLRow {
  [column: string]: unknown;
}

export interface MySQLField {
  name: string;
  type: string;
}

export async function createMySQLClient(connectionString: string): Promise<MySQLClient> {
  const mysql = await import("mysql2/promise");
  const pool = mysql.createPool(connectionString);
  return {
    async query(sql: string, params?: unknown[]) {
      const [rows, fields] = await pool.query(sql, params);
      return [rows as MySQLRow[], (fields ?? []) as unknown as MySQLField[]];
    },
    async end() {
      await pool.end();
    },
    async ping() {
      const conn = await pool.getConnection();
      conn.release();
    },
  };
}
