import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, Neo4jConfigSchema } from "../src/config.js";

describe("Neo4jConfigSchema", () => {
  it("validates with required fields and defaults", () => {
    const result = Neo4jConfigSchema.parse({
      url: "http://localhost:7474",
      user: "neo4j",
      password: "password",
    });
    expect(result.url).toBe("http://localhost:7474");
    expect(result.user).toBe("neo4j");
    expect(result.password).toBe("password");
    expect(result.database).toBe("neo4j");
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
  });

  it("accepts custom values", () => {
    const result = Neo4jConfigSchema.parse({
      url: "http://neo4j.example.com:7474",
      user: "admin",
      password: "secret123",
      database: "mydb",
      logLevel: "debug",
      transport: "sse",
      port: 8080,
    });
    expect(result.url).toBe("http://neo4j.example.com:7474");
    expect(result.user).toBe("admin");
    expect(result.password).toBe("secret123");
    expect(result.database).toBe("mydb");
    expect(result.logLevel).toBe("debug");
    expect(result.transport).toBe("sse");
    expect(result.port).toBe(8080);
  });

  it("rejects empty url", () => {
    expect(() =>
      Neo4jConfigSchema.parse({ url: "", user: "neo4j", password: "pass" }),
    ).toThrow();
  });

  it("rejects missing url", () => {
    expect(() =>
      Neo4jConfigSchema.parse({ user: "neo4j", password: "pass" }),
    ).toThrow();
  });

  it("rejects missing user", () => {
    expect(() =>
      Neo4jConfigSchema.parse({ url: "http://localhost:7474", password: "pass" }),
    ).toThrow();
  });

  it("rejects missing password", () => {
    expect(() =>
      Neo4jConfigSchema.parse({ url: "http://localhost:7474", user: "neo4j" }),
    ).toThrow();
  });

  it("rejects invalid log level", () => {
    expect(() =>
      Neo4jConfigSchema.parse({
        url: "http://localhost:7474",
        user: "neo4j",
        password: "pass",
        logLevel: "verbose",
      }),
    ).toThrow();
  });

  it("rejects invalid transport", () => {
    expect(() =>
      Neo4jConfigSchema.parse({
        url: "http://localhost:7474",
        user: "neo4j",
        password: "pass",
        transport: "websocket",
      }),
    ).toThrow();
  });

  it("schema parse succeeds with valid data", () => {
    const result = Neo4jConfigSchema.safeParse({
      url: "http://localhost:7474",
      user: "neo4j",
      password: "password",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.url).toBe("http://localhost:7474");
    }
  });

  it("schema parse fails with invalid data", () => {
    const result = Neo4jConfigSchema.safeParse({ url: "" });
    expect(result.success).toBe(false);
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

  it("throws when NEO4J_URL is missing", () => {
    delete process.env.NEO4J_URL;
    expect(() => loadConfig()).toThrow("NEO4J_URL environment variable is required");
  });

  it("throws when NEO4J_USER is missing", () => {
    process.env.NEO4J_URL = "http://localhost:7474";
    delete process.env.NEO4J_USER;
    expect(() => loadConfig()).toThrow("NEO4J_USER environment variable is required");
  });

  it("throws when NEO4J_PASSWORD is missing", () => {
    process.env.NEO4J_URL = "http://localhost:7474";
    process.env.NEO4J_USER = "neo4j";
    delete process.env.NEO4J_PASSWORD;
    expect(() => loadConfig()).toThrow("NEO4J_PASSWORD environment variable is required");
  });

  it("loads config from environment variables", () => {
    process.env.NEO4J_URL = "http://neo4j.example.com:7474";
    process.env.NEO4J_USER = "admin";
    process.env.NEO4J_PASSWORD = "secret123";
    process.env.NEO4J_DATABASE = "mydb";
    process.env.MCP_LOG_LEVEL = "debug";

    const config = loadConfig();
    expect(config.url).toBe("http://neo4j.example.com:7474");
    expect(config.user).toBe("admin");
    expect(config.password).toBe("secret123");
    expect(config.database).toBe("mydb");
    expect(config.logLevel).toBe("debug");
  });

  it("loads config with defaults when optional env vars are missing", () => {
    process.env.NEO4J_URL = "http://localhost:7474";
    process.env.NEO4J_USER = "neo4j";
    process.env.NEO4J_PASSWORD = "password";
    delete process.env.NEO4J_DATABASE;

    const config = loadConfig();
    expect(config.url).toBe("http://localhost:7474");
    expect(config.user).toBe("neo4j");
    expect(config.database).toBe("neo4j");
  });
});
