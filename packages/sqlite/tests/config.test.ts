import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, SQLiteConfigSchema } from "../src/config.js";

describe("SQLiteConfigSchema", () => {
  it("validates a valid config", () => {
    const result = SQLiteConfigSchema.parse({
      dbPath: "/tmp/test.db",
    });
    expect(result.dbPath).toBe("/tmp/test.db");
    expect(result.readonly).toBe(false);
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
  });

  it("accepts readonly mode", () => {
    const result = SQLiteConfigSchema.parse({
      dbPath: "/tmp/test.db",
      readonly: true,
    });
    expect(result.readonly).toBe(true);
  });

  it("rejects empty dbPath", () => {
    expect(() =>
      SQLiteConfigSchema.parse({
        dbPath: "",
      }),
    ).toThrow();
  });

  it("rejects invalid log level", () => {
    expect(() =>
      SQLiteConfigSchema.parse({
        dbPath: "/tmp/test.db",
        logLevel: "verbose",
      }),
    ).toThrow();
  });

  it("rejects invalid transport", () => {
    expect(() =>
      SQLiteConfigSchema.parse({
        dbPath: "/tmp/test.db",
        transport: "websocket",
      }),
    ).toThrow();
  });

  it("rejects invalid port", () => {
    expect(() =>
      SQLiteConfigSchema.parse({
        dbPath: "/tmp/test.db",
        port: -1,
      }),
    ).toThrow();
  });
});

describe("loadConfig", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("throws when SQLITE_DB_PATH is missing", () => {
    delete process.env.SQLITE_DB_PATH;
    expect(() => loadConfig()).toThrow("SQLITE_DB_PATH");
  });

  it("loads config from environment variables", () => {
    process.env.SQLITE_DB_PATH = "/tmp/test.db";
    process.env.SQLITE_READONLY = "true";
    process.env.MCP_LOG_LEVEL = "debug";

    const config = loadConfig();
    expect(config.dbPath).toBe("/tmp/test.db");
    expect(config.readonly).toBe(true);
    expect(config.logLevel).toBe("debug");
  });

  it("uses defaults for optional env vars", () => {
    process.env.SQLITE_DB_PATH = "/tmp/test.db";
    delete process.env.SQLITE_READONLY;
    delete process.env.MCP_LOG_LEVEL;
    delete process.env.MCP_TRANSPORT;
    delete process.env.MCP_PORT;

    const config = loadConfig();
    expect(config.readonly).toBe(false);
    expect(config.logLevel).toBe("info");
    expect(config.transport).toBe("stdio");
    expect(config.port).toBe(3000);
  });
});
