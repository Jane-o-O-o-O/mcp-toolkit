import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, GitHubConfigSchema } from "../src/config.js";

describe("GitHubConfigSchema", () => {
  it("validates with required token", () => {
    const result = GitHubConfigSchema.parse({ token: "ghp_abc123" });
    expect(result.token).toBe("ghp_abc123");
    expect(result.baseUrl).toBe("https://api.github.com");
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
  });

  it("accepts custom base URL for GitHub Enterprise", () => {
    const result = GitHubConfigSchema.parse({
      token: "ghp_abc123",
      baseUrl: "https://github.example.com/api/v3",
    });
    expect(result.baseUrl).toBe("https://github.example.com/api/v3");
  });

  it("rejects empty token", () => {
    expect(() =>
      GitHubConfigSchema.parse({ token: "" }),
    ).toThrow();
  });

  it("rejects missing token", () => {
    expect(() =>
      GitHubConfigSchema.parse({}),
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

  it("throws when GITHUB_TOKEN is missing", () => {
    delete process.env.GITHUB_TOKEN;
    expect(() => loadConfig()).toThrow("GITHUB_TOKEN");
  });

  it("loads config from environment variables", () => {
    process.env.GITHUB_TOKEN = "ghp_test123";
    process.env.MCP_LOG_LEVEL = "debug";

    const config = loadConfig();
    expect(config.token).toBe("ghp_test123");
    expect(config.logLevel).toBe("debug");
  });

  it("supports custom API URL", () => {
    process.env.GITHUB_TOKEN = "ghp_test123";
    process.env.GITHUB_API_URL = "https://github.example.com/api/v3";

    const config = loadConfig();
    expect(config.baseUrl).toBe("https://github.example.com/api/v3");
  });
});
