import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, LinearConfigSchema } from "../src/config.js";

describe("LinearConfigSchema", () => {
  it("validates with required apiKey", () => {
    const result = LinearConfigSchema.parse({ apiKey: "test-key-123" });
    expect(result.apiKey).toBe("test-key-123");
    expect(result.baseUrl).toBe("https://api.linear.app/graphql");
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
  });

  it("accepts custom baseUrl", () => {
    const result = LinearConfigSchema.parse({
      apiKey: "key",
      baseUrl: "https://custom.linear.app/graphql",
    });
    expect(result.baseUrl).toBe("https://custom.linear.app/graphql");
  });

  it("rejects empty apiKey", () => {
    expect(() => LinearConfigSchema.parse({ apiKey: "" })).toThrow();
  });

  it("rejects missing apiKey", () => {
    expect(() => LinearConfigSchema.parse({})).toThrow();
  });

  it("accepts custom log level", () => {
    const result = LinearConfigSchema.parse({
      apiKey: "key",
      logLevel: "debug",
    });
    expect(result.logLevel).toBe("debug");
  });

  it("rejects invalid log level", () => {
    expect(() =>
      LinearConfigSchema.parse({ apiKey: "key", logLevel: "verbose" }),
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

  it("throws when LINEAR_API_KEY is missing", () => {
    delete process.env.LINEAR_API_KEY;
    expect(() => loadConfig()).toThrow("LINEAR_API_KEY environment variable is required");
  });

  it("loads config from environment variables", () => {
    process.env.LINEAR_API_KEY = "lin_key_abc123";
    process.env.LINEAR_BASE_URL = "https://custom.linear.app/graphql";
    process.env.MCP_LOG_LEVEL = "debug";

    const config = loadConfig();
    expect(config.apiKey).toBe("lin_key_abc123");
    expect(config.baseUrl).toBe("https://custom.linear.app/graphql");
    expect(config.logLevel).toBe("debug");
  });
});
