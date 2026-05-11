/**
 * SQLite database interface — subset of better-sqlite3 methods used by our tools.
 * This abstraction allows mocking in tests without depending on better-sqlite3.
 */
export interface SQLiteDatabase {
  prepare(sql: string): SQLiteStatement;
  exec(sql: string): SQLiteDatabase;
  close(): void;
  readonly open: boolean;
  readonly name: string;
  readonly readonly: boolean;
}

export interface SQLiteStatement {
  run(...params: unknown[]): SQLiteRunResult;
  get(...params: unknown[]): Record<string, unknown> | undefined;
  all(...params: unknown[]): Record<string, unknown>[];
  pluck(): SQLiteStatement;
}

export interface SQLiteRunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}
