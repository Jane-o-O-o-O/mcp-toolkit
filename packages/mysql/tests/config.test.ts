import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, MySQLConfigSchema } from "../src/config.js";

describe("MySQLConfigSchema", () => {
  it("validates a valid config", () => {
    const result = MySQLConfigSchema.parse({
      connectionString: "mysql://user:pass@localhost:3306/mydb",
    });
    expect(result.connectionString).toBe("mysql://user:pass@localhost:3306/mydb");
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
  });

  it("rejects empty connection string", () => {
    expect(() => MySQLConfigSchema.parse({ connectionString: "" })).toThrow();
  });

  it("accepts custom log level and transport", () => {
    const result = MySQLConfigSchema.parse({
      connectionString: "mysql://localhost/test",
      logLevel: "debug",
      transport: "sse",
      port: 8080,
    });
    expect(result.logLevel).toBe("debug");
    expect(result.transport).toBe("sse");
    expect(result.port).toBe(8080);
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

  it("loads from MYSQL_URL env var", () => {
    process.env.MYSQL_URL = "mysql://user:pass@localhost:3306/testdb";
    const config = loadConfig();
    expect(config.connectionString).toBe("mysql://user:pass@localhost:3306/testdb");
  });

  it("falls back to DATABASE_URL", () => {
    delete process.env.MYSQL_URL;
    process.env.DATABASE_URL = "mysql://user:pass@localhost:3306/testdb";
    const config = loadConfig();
    expect(config.connectionString).toBe("mysql://user:pass@localhost:3306/testdb");
  });

  it("throws when no URL is set", () => {
    delete process.env.MYSQL_URL;
    delete process.env.DATABASE_URL;
    expect(() => loadConfig()).toThrow("MYSQL_URL or DATABASE_URL");
  });
});
