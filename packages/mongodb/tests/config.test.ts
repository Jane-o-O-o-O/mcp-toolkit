import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, MongoDBConfigSchema } from "../src/config.js";

describe("MongoDBConfigSchema", () => {
  it("validates a valid config", () => {
    const result = MongoDBConfigSchema.parse({
      connectionString: "mongodb://user:pass@localhost:27017/mydb",
    });
    expect(result.connectionString).toBe("mongodb://user:pass@localhost:27017/mydb");
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
  });

  it("rejects empty connection string", () => {
    expect(() => MongoDBConfigSchema.parse({ connectionString: "" })).toThrow();
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

  it("loads from MONGODB_URL env var", () => {
    process.env.MONGODB_URL = "mongodb://localhost:27017/testdb";
    const config = loadConfig();
    expect(config.connectionString).toBe("mongodb://localhost:27017/testdb");
  });

  it("falls back to DATABASE_URL", () => {
    delete process.env.MONGODB_URL;
    process.env.DATABASE_URL = "mongodb://localhost:27017/testdb";
    const config = loadConfig();
    expect(config.connectionString).toBe("mongodb://localhost:27017/testdb");
  });

  it("throws when no URL is set", () => {
    delete process.env.MONGODB_URL;
    delete process.env.DATABASE_URL;
    expect(() => loadConfig()).toThrow("MONGODB_URL or DATABASE_URL");
  });
});
