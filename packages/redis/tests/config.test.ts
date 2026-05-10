import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, RedisConfigSchema } from "../src/config.js";

describe("RedisConfigSchema", () => {
  it("validates a valid config", () => {
    const result = RedisConfigSchema.parse({
      url: "redis://localhost:6379",
    });
    expect(result.url).toBe("redis://localhost:6379");
    expect(result.keyPrefix).toBe("");
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
  });

  it("accepts custom key prefix", () => {
    const result = RedisConfigSchema.parse({
      url: "redis://localhost:6379",
      keyPrefix: "app:prod:",
    });
    expect(result.keyPrefix).toBe("app:prod:");
  });

  it("rejects invalid log level", () => {
    expect(() =>
      RedisConfigSchema.parse({
        url: "redis://localhost:6379",
        logLevel: "verbose",
      }),
    ).toThrow();
  });

  it("rejects invalid transport", () => {
    expect(() =>
      RedisConfigSchema.parse({
        url: "redis://localhost:6379",
        transport: "websocket",
      }),
    ).toThrow();
  });

  it("rejects invalid port", () => {
    expect(() =>
      RedisConfigSchema.parse({
        url: "redis://localhost:6379",
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

  it("throws when REDIS_URL is missing", () => {
    delete process.env.REDIS_URL;
    expect(() => loadConfig()).toThrow("REDIS_URL");
  });

  it("loads config from environment variables", () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    process.env.REDIS_KEY_PREFIX = "test:";
    process.env.MCP_LOG_LEVEL = "debug";

    const config = loadConfig();
    expect(config.url).toBe("redis://localhost:6379");
    expect(config.keyPrefix).toBe("test:");
    expect(config.logLevel).toBe("debug");
  });

  it("uses defaults for optional env vars", () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    delete process.env.REDIS_KEY_PREFIX;
    delete process.env.MCP_LOG_LEVEL;
    delete process.env.MCP_TRANSPORT;
    delete process.env.MCP_PORT;

    const config = loadConfig();
    expect(config.keyPrefix).toBe("");
    expect(config.logLevel).toBe("info");
    expect(config.transport).toBe("stdio");
    expect(config.port).toBe(3000);
  });
});
