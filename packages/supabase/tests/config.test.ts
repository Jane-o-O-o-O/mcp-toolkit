import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, SupabaseConfigSchema } from "../src/config.js";

describe("SupabaseConfigSchema", () => {
  it("validates with required fields", () => {
    const result = SupabaseConfigSchema.parse({
      projectUrl: "https://abc.supabase.co",
      serviceRoleKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
    });
    expect(result.projectUrl).toBe("https://abc.supabase.co");
    expect(result.serviceRoleKey).toBe("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test");
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
  });

  it("rejects invalid URL", () => {
    expect(() =>
      SupabaseConfigSchema.parse({ projectUrl: "not-a-url", serviceRoleKey: "key" }),
    ).toThrow();
  });

  it("rejects empty serviceRoleKey", () => {
    expect(() =>
      SupabaseConfigSchema.parse({ projectUrl: "https://abc.supabase.co", serviceRoleKey: "" }),
    ).toThrow();
  });

  it("rejects missing fields", () => {
    expect(() => SupabaseConfigSchema.parse({})).toThrow();
    expect(() => SupabaseConfigSchema.parse({ projectUrl: "https://abc.supabase.co" })).toThrow();
  });

  it("rejects invalid log level", () => {
    expect(() =>
      SupabaseConfigSchema.parse({
        projectUrl: "https://abc.supabase.co",
        serviceRoleKey: "key",
        logLevel: "verbose",
      }),
    ).toThrow();
  });

  it("rejects invalid transport", () => {
    expect(() =>
      SupabaseConfigSchema.parse({
        projectUrl: "https://abc.supabase.co",
        serviceRoleKey: "key",
        transport: "websocket",
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

  it("throws when SUPABASE_URL is missing", () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => loadConfig()).toThrow("SUPABASE_URL");
  });

  it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", () => {
    process.env.SUPABASE_URL = "https://abc.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => loadConfig()).toThrow("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("loads config from environment variables", () => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key-123";
    process.env.MCP_LOG_LEVEL = "debug";

    const config = loadConfig();
    expect(config.projectUrl).toBe("https://test.supabase.co");
    expect(config.serviceRoleKey).toBe("test-key-123");
    expect(config.logLevel).toBe("debug");
  });
});
