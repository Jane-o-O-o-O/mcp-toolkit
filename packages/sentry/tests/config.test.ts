import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, SentryConfigSchema } from "../src/config.js";

describe("SentryConfigSchema", () => {
  it("validates with required fields and defaults", () => {
    const result = SentryConfigSchema.parse({ authToken: "sntrys_xxx", orgSlug: "my-org" });
    expect(result.authToken).toBe("sntrys_xxx");
    expect(result.orgSlug).toBe("my-org");
    expect(result.baseUrl).toBe("https://sentry.io/api/0");
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
  });

  it("accepts custom values", () => {
    const result = SentryConfigSchema.parse({
      authToken: "sntrys_custom",
      orgSlug: "custom-org",
      baseUrl: "https://self-hosted.sentry.io/api/0",
      logLevel: "debug",
      transport: "sse",
      port: 8080,
    });
    expect(result.baseUrl).toBe("https://self-hosted.sentry.io/api/0");
    expect(result.logLevel).toBe("debug");
    expect(result.transport).toBe("sse");
    expect(result.port).toBe(8080);
  });

  it("rejects empty authToken", () => {
    expect(() => SentryConfigSchema.parse({ authToken: "", orgSlug: "org" })).toThrow();
  });

  it("rejects missing authToken", () => {
    expect(() => SentryConfigSchema.parse({ orgSlug: "org" })).toThrow();
  });

  it("rejects empty orgSlug", () => {
    expect(() => SentryConfigSchema.parse({ authToken: "token", orgSlug: "" })).toThrow();
  });

  it("rejects missing orgSlug", () => {
    expect(() => SentryConfigSchema.parse({ authToken: "token" })).toThrow();
  });

  it("rejects invalid log level", () => {
    expect(() => SentryConfigSchema.parse({ authToken: "t", orgSlug: "o", logLevel: "verbose" })).toThrow();
  });

  it("rejects invalid transport", () => {
    expect(() => SentryConfigSchema.parse({ authToken: "t", orgSlug: "o", transport: "websocket" })).toThrow();
  });

  it("schema safeParse succeeds with valid data", () => {
    const result = SentryConfigSchema.safeParse({ authToken: "sntrys_abc", orgSlug: "my-org" });
    expect(result.success).toBe(true);
  });

  it("schema safeParse fails with invalid data", () => {
    const result = SentryConfigSchema.safeParse({ authToken: "", orgSlug: "" });
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

  it("throws when SENTRY_AUTH_TOKEN is missing", () => {
    delete process.env.SENTRY_AUTH_TOKEN;
    process.env.SENTRY_ORG = "my-org";
    expect(() => loadConfig()).toThrow("SENTRY_AUTH_TOKEN environment variable is required");
  });

  it("throws when SENTRY_ORG is missing", () => {
    process.env.SENTRY_AUTH_TOKEN = "sntrys_xxx";
    delete process.env.SENTRY_ORG;
    expect(() => loadConfig()).toThrow("SENTRY_ORG environment variable is required");
  });

  it("loads config from environment variables", () => {
    process.env.SENTRY_AUTH_TOKEN = "sntrys_env";
    process.env.SENTRY_ORG = "env-org";
    process.env.SENTRY_BASE_URL = "https://custom.sentry.io/api/0";
    process.env.MCP_LOG_LEVEL = "debug";

    const config = loadConfig();
    expect(config.authToken).toBe("sntrys_env");
    expect(config.orgSlug).toBe("env-org");
    expect(config.baseUrl).toBe("https://custom.sentry.io/api/0");
    expect(config.logLevel).toBe("debug");
  });

  it("loads config with defaults when optional env vars are missing", () => {
    process.env.SENTRY_AUTH_TOKEN = "sntrys_default";
    process.env.SENTRY_ORG = "default-org";
    delete process.env.SENTRY_BASE_URL;

    const config = loadConfig();
    expect(config.authToken).toBe("sntrys_default");
    expect(config.orgSlug).toBe("default-org");
    expect(config.baseUrl).toBe("https://sentry.io/api/0");
  });
});
