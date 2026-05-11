import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PostgresConfigSchema, loadConfig } from "../src/config.js";

describe("PostgresConfig", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  describe("PostgresConfigSchema", () => {
    it("should parse valid config", () => {
      const result = PostgresConfigSchema.parse({
        connectionString: "postgresql://localhost/test",
      });
      expect(result.connectionString).toBe("postgresql://localhost/test");
      expect(result.maxConnections).toBe(10);
      expect(result.queryTimeout).toBe(30000);
      expect(result.logLevel).toBe("info");
      expect(result.transport).toBe("stdio");
      expect(result.port).toBe(3000);
    });

    it("should require connectionString", () => {
      expect(() => PostgresConfigSchema.parse({})).toThrow();
    });

    it("should reject empty connectionString", () => {
      expect(() => PostgresConfigSchema.parse({ connectionString: "" })).toThrow();
    });

    it("should accept custom values", () => {
      const result = PostgresConfigSchema.parse({
        connectionString: "postgresql://user:pass@db.example.com:5432/prod",
        maxConnections: 20,
        queryTimeout: 60000,
        logLevel: "debug",
        transport: "sse",
        port: 8080,
      });
      expect(result.maxConnections).toBe(20);
      expect(result.queryTimeout).toBe(60000);
      expect(result.logLevel).toBe("debug");
    });
  });

  describe("loadConfig", () => {
    it("should throw when POSTGRES_URL is not set", () => {
      delete process.env.POSTGRES_URL;
      delete process.env.DATABASE_URL;
      expect(() => loadConfig()).toThrow("POSTGRES_URL or DATABASE_URL");
    });

    it("should load from POSTGRES_URL", () => {
      process.env.POSTGRES_URL = "postgresql://localhost/mydb";
      const config = loadConfig();
      expect(config.connectionString).toBe("postgresql://localhost/mydb");
    });

    it("should fallback to DATABASE_URL", () => {
      delete process.env.POSTGRES_URL;
      process.env.DATABASE_URL = "postgresql://localhost/otherdb";
      const config = loadConfig();
      expect(config.connectionString).toBe("postgresql://localhost/otherdb");
    });

    it("should prefer POSTGRES_URL over DATABASE_URL", () => {
      process.env.POSTGRES_URL = "postgresql://localhost/primary";
      process.env.DATABASE_URL = "postgresql://localhost/fallback";
      const config = loadConfig();
      expect(config.connectionString).toBe("postgresql://localhost/primary");
    });

    it("should parse optional env vars", () => {
      process.env.POSTGRES_URL = "postgresql://localhost/test";
      process.env.POSTGRES_MAX_CONNECTIONS = "25";
      process.env.POSTGRES_QUERY_TIMEOUT = "5000";
      process.env.MCP_LOG_LEVEL = "debug";
      process.env.MCP_PORT = "9090";

      const config = loadConfig();
      expect(config.maxConnections).toBe(25);
      expect(config.queryTimeout).toBe(5000);
      expect(config.logLevel).toBe("debug");
      expect(config.port).toBe(9090);
    });
  });
});
