/** Supabase client interface for testability */
export interface SupabaseClient {
  executeSql(query: string, params?: unknown[]): Promise<SqlResult>;
  listTables(schema?: string): Promise<TableSummary[]>;
  getTableSchema(tableName: string, schema?: string): Promise<ColumnSchema[]>;
  insertRows(tableName: string, rows: Record<string, unknown>[], schema?: string): Promise<MutationResult>;
  updateRows(tableName: string, updates: Record<string, unknown>, filter: Record<string, unknown>, schema?: string): Promise<MutationResult>;
  deleteRows(tableName: string, filter: Record<string, unknown>, schema?: string): Promise<MutationResult>;
  listBuckets(): Promise<BucketSummary[]>;
  uploadFile(bucket: string, path: string, content: string, contentType?: string): Promise<UploadResult>;
}

export interface SqlResult {
  rows: Record<string, unknown>[];
  rowCount: number;
  command: string;
}

export interface TableSummary {
  schema: string;
  name: string;
  type: string;
  rowCount: number | null;
  comment: string | null;
}

export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  comment: string | null;
}

export interface MutationResult {
  rows: Record<string, unknown>[];
  rowCount: number;
}

export interface BucketSummary {
  id: string;
  name: string;
  public: boolean;
  fileCount: number;
  createdAt: string;
}

export interface UploadResult {
  path: string;
  fullPath: string;
}
