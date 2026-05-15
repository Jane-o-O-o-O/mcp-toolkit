import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, CloudflareConfigSchema } from "../src/config.js";

describe("CloudflareConfig", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should have correct schema shape", () => {
    const shape = CloudflareConfigSchema.shape;
    expect(shape.apiToken).toBeDefined();
    expect(shape.accountId).toBeDefined();
    expect(shape.baseUrl).toBeDefined();
  });

  it("should require apiToken to be non-empty", () => {
    expect(() =>
      CloudflareConfigSchema.parse({
        apiToken: "",
        accountId: "account-123",
      })
    ).toThrow();
  });

  it("should require accountId to be non-empty", () => {
    expect(() =>
      CloudflareConfigSchema.parse({
        apiToken: "token-123",
        accountId: "",
      })
    ).toThrow();
  });

  it("should parse a valid config", () => {
    const result = CloudflareConfigSchema.parse({
      apiToken: "my-token",
      accountId: "my-account",
    });
    expect(result.apiToken).toBe("my-token");
    expect(result.accountId).toBe("my-account");
    expect(result.baseUrl).toBe("https://api.cloudflare.com/client/v4");
  });

  it("should allow a custom baseUrl", () => {
    const result = CloudflareConfigSchema.parse({
      apiToken: "my-token",
      accountId: "my-account",
      baseUrl: "https://custom.cloudflare.com/v4",
    });
    expect(result.baseUrl).toBe("https://custom.cloudflare.com/v4");
  });

  it("loadConfig should throw if CLOUDFLARE_API_TOKEN is missing", () => {
    delete process.env.CLOUDFLARE_API_TOKEN;
    process.env.CLOUDFLARE_ACCOUNT_ID = "account-123";
    expect(() => loadConfig()).toThrow("CLOUDFLARE_API_TOKEN");
  });

  it("loadConfig should throw if CLOUDFLARE_ACCOUNT_ID is missing", () => {
    process.env.CLOUDFLARE_API_TOKEN = "token-123";
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    expect(() => loadConfig()).toThrow("CLOUDFLARE_ACCOUNT_ID");
  });

  it("loadConfig should succeed with valid env vars", () => {
    process.env.CLOUDFLARE_API_TOKEN = "test-token";
    process.env.CLOUDFLARE_ACCOUNT_ID = "test-account";
    const config = loadConfig();
    expect(config.apiToken).toBe("test-token");
    expect(config.accountId).toBe("test-account");
  });
});
