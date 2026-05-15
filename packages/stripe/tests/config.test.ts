import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, StripeConfigSchema } from "../src/config.js";

describe("StripeConfigSchema", () => {
  it("validates with required apiKey and defaults", () => {
    const result = StripeConfigSchema.parse({ apiKey: "sk_test_123" });
    expect(result.apiKey).toBe("sk_test_123");
    expect(result.apiVersion).toBe("2024-12-18.acacia");
    expect(result.baseUrl).toBe("https://api.stripe.com/v1");
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
  });

  it("accepts custom values", () => {
    const result = StripeConfigSchema.parse({
      apiKey: "sk_live_456",
      apiVersion: "2024-10-28.acacia",
      baseUrl: "https://custom.stripe.com/v1",
      logLevel: "debug",
      transport: "sse",
      port: 8080,
    });
    expect(result.apiKey).toBe("sk_live_456");
    expect(result.apiVersion).toBe("2024-10-28.acacia");
    expect(result.baseUrl).toBe("https://custom.stripe.com/v1");
    expect(result.logLevel).toBe("debug");
    expect(result.transport).toBe("sse");
    expect(result.port).toBe(8080);
  });

  it("rejects empty apiKey", () => {
    expect(() => StripeConfigSchema.parse({ apiKey: "" })).toThrow();
  });

  it("rejects missing apiKey", () => {
    expect(() => StripeConfigSchema.parse({})).toThrow();
  });

  it("rejects invalid log level", () => {
    expect(() => StripeConfigSchema.parse({ apiKey: "sk_test", logLevel: "verbose" })).toThrow();
  });

  it("rejects invalid transport", () => {
    expect(() => StripeConfigSchema.parse({ apiKey: "sk_test", transport: "websocket" })).toThrow();
  });

  it("schema parse succeeds with valid data", () => {
    const result = StripeConfigSchema.safeParse({ apiKey: "sk_test_abc" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.apiKey).toBe("sk_test_abc");
    }
  });

  it("schema parse fails with invalid data", () => {
    const result = StripeConfigSchema.safeParse({ apiKey: "" });
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

  it("throws when STRIPE_API_KEY is missing", () => {
    delete process.env.STRIPE_API_KEY;
    expect(() => loadConfig()).toThrow("STRIPE_API_KEY environment variable is required");
  });

  it("loads config from environment variables", () => {
    process.env.STRIPE_API_KEY = "sk_test_env_key";
    process.env.STRIPE_API_VERSION = "2024-10-28.acacia";
    process.env.STRIPE_BASE_URL = "https://custom.stripe.com/v1";
    process.env.MCP_LOG_LEVEL = "debug";

    const config = loadConfig();
    expect(config.apiKey).toBe("sk_test_env_key");
    expect(config.apiVersion).toBe("2024-10-28.acacia");
    expect(config.baseUrl).toBe("https://custom.stripe.com/v1");
    expect(config.logLevel).toBe("debug");
  });

  it("loads config with defaults when optional env vars are missing", () => {
    process.env.STRIPE_API_KEY = "sk_test_defaults";
    delete process.env.STRIPE_API_VERSION;
    delete process.env.STRIPE_BASE_URL;

    const config = loadConfig();
    expect(config.apiKey).toBe("sk_test_defaults");
    expect(config.apiVersion).toBe("2024-12-18.acacia");
    expect(config.baseUrl).toBe("https://api.stripe.com/v1");
  });
});
