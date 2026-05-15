import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, VaultConfigSchema } from "../src/config.js";

describe("VaultConfigSchema", () => {
  it("validates with required token and defaults", () => {
    const result = VaultConfigSchema.parse({ token: "hvs.test-token-123" });
    expect(result.token).toBe("hvs.test-token-123");
    expect(result.baseUrl).toBe("http://82.157.13.190:8200");
    expect(result.engine).toBe("secret");
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
  });

  it("accepts custom values", () => {
    const result = VaultConfigSchema.parse({
      token: "hvs.custom-token",
      baseUrl: "https://vault.example.com:8200",
      engine: "kv",
      logLevel: "debug",
      transport: "sse",
      port: 8080,
    });
    expect(result.token).toBe("hvs.custom-token");
    expect(result.baseUrl).toBe("https://vault.example.com:8200");
    expect(result.engine).toBe("kv");
    expect(result.logLevel).toBe("debug");
    expect(result.transport).toBe("sse");
    expect(result.port).toBe(8080);
  });

  it("rejects empty token", () => {
    expect(() => VaultConfigSchema.parse({ token: "" })).toThrow();
  });

  it("rejects missing token", () => {
    expect(() => VaultConfigSchema.parse({})).toThrow();
  });

  it("rejects invalid log level", () => {
    expect(() => VaultConfigSchema.parse({ token: "hvs.test", logLevel: "verbose" })).toThrow();
  });

  it("rejects invalid transport", () => {
    expect(() => VaultConfigSchema.parse({ token: "hvs.test", transport: "websocket" })).toThrow();
  });

  it("schema parse succeeds with valid data", () => {
    const result = VaultConfigSchema.safeParse({ token: "hvs.test-abc" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.token).toBe("hvs.test-abc");
    }
  });

  it("schema parse fails with invalid data", () => {
    const result = VaultConfigSchema.safeParse({ token: "" });
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

  it("throws when VAULT_TOKEN is missing", () => {
    delete process.env.VAULT_TOKEN;
    expect(() => loadConfig()).toThrow("VAULT_TOKEN environment variable is required");
  });

  it("loads config from environment variables", () => {
    process.env.VAULT_TOKEN = "hvs.env-token";
    process.env.VAULT_ADDR = "https://vault.prod.example.com:8200";
    process.env.VAULT_ENGINE = "kv-v2";
    process.env.MCP_LOG_LEVEL = "debug";

    const config = loadConfig();
    expect(config.token).toBe("hvs.env-token");
    expect(config.baseUrl).toBe("https://vault.prod.example.com:8200");
    expect(config.engine).toBe("kv-v2");
    expect(config.logLevel).toBe("debug");
  });

  it("loads config with defaults when optional env vars are missing", () => {
    process.env.VAULT_TOKEN = "hvs.default-test";
    delete process.env.VAULT_ADDR;
    delete process.env.VAULT_ENGINE;

    const config = loadConfig();
    expect(config.token).toBe("hvs.default-test");
    expect(config.baseUrl).toBe("http://82.157.13.190:8200");
    expect(config.engine).toBe("secret");
  });
});
