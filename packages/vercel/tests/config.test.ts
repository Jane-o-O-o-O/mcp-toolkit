import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, VercelConfigSchema } from "../src/config.js";

describe("VercelConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should throw if VERCEL_TOKEN is missing", () => {
    delete process.env["VERCEL_TOKEN"];
    delete process.env["MCP_SERVER_NAME"];
    expect(() => loadConfig()).toThrow("VERCEL_TOKEN environment variable is required");
  });

  it("should load config with required token", () => {
    process.env["VERCEL_TOKEN"] = "test-token-123";
    delete process.env["MCP_SERVER_NAME"];
    const config = loadConfig();
    expect(config.token).toBe("test-token-123");
    expect(config.baseUrl).toBe("https://api.vercel.com");
  });

  it("should load optional teamId", () => {
    process.env["VERCEL_TOKEN"] = "test-token";
    process.env["VERCEL_TEAM_ID"] = "team_123";
    delete process.env["MCP_SERVER_NAME"];
    const config = loadConfig();
    expect(config.teamId).toBe("team_123");
  });

  it("should omit teamId when not set", () => {
    process.env["VERCEL_TOKEN"] = "test-token";
    delete process.env["VERCEL_TEAM_ID"];
    delete process.env["MCP_SERVER_NAME"];
    const config = loadConfig();
    expect(config.teamId).toBeUndefined();
  });

  it("should parse custom baseUrl", () => {
    process.env["VERCEL_TOKEN"] = "test-token";
    process.env["VERCEL_BASE_URL"] = "https://custom.vercel.com";
    delete process.env["MCP_SERVER_NAME"];
    const config = loadConfig();
    expect(config.baseUrl).toBe("https://custom.vercel.com");
  });

  it("should use default baseUrl", () => {
    process.env["VERCEL_TOKEN"] = "test-token";
    delete process.env["VERCEL_BASE_URL"];
    delete process.env["MCP_SERVER_NAME"];
    const config = loadConfig();
    expect(config.baseUrl).toBe("https://api.vercel.com");
  });

  it("should reject empty token", () => {
    const result = VercelConfigSchema.safeParse({
      token: "",
      baseUrl: "https://api.vercel.com",
    });
    expect(result.success).toBe(false);
  });

  it("should validate full config schema", () => {
    const result = VercelConfigSchema.safeParse({
      token: "valid-token",
      teamId: "team_abc",
      baseUrl: "https://api.vercel.com",
    });
    expect(result.success).toBe(true);
  });
});
