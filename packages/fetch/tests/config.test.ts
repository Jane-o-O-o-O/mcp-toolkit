import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, FetchConfigSchema } from "../src/config.js";

describe("FetchConfigSchema", () => {
  it("validates with defaults", () => {
    const result = FetchConfigSchema.parse({});
    expect(result.defaultTimeout).toBe(30000);
    expect(result.maxResponseSize).toBe(1_000_000);
    expect(result.defaultHeaders).toEqual({});
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
  });

  it("accepts custom values", () => {
    const result = FetchConfigSchema.parse({
      defaultTimeout: 5000,
      maxResponseSize: 500000,
      defaultHeaders: { "User-Agent": "mcp-toolkit" },
      logLevel: "debug",
      transport: "sse",
      port: 9090,
    });
    expect(result.defaultTimeout).toBe(5000);
    expect(result.defaultHeaders).toEqual({ "User-Agent": "mcp-toolkit" });
    expect(result.transport).toBe("sse");
    expect(result.port).toBe(9090);
  });

  it("rejects negative timeout", () => {
    expect(() => FetchConfigSchema.parse({ defaultTimeout: -1 })).toThrow();
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

  it("loads with defaults when no env vars set", () => {
    delete process.env.FETCH_TIMEOUT;
    delete process.env.FETCH_MAX_SIZE;
    delete process.env.FETCH_DEFAULT_HEADERS;
    const config = loadConfig();
    expect(config.defaultTimeout).toBe(30000);
  });

  it("reads timeout from env", () => {
    process.env.FETCH_TIMEOUT = "5000";
    const config = loadConfig();
    expect(config.defaultTimeout).toBe(5000);
  });

  it("reads default headers from JSON env", () => {
    process.env.FETCH_DEFAULT_HEADERS = '{"X-Custom":"test"}';
    const config = loadConfig();
    expect(config.defaultHeaders).toEqual({ "X-Custom": "test" });
  });

  it("ignores invalid JSON in headers env", () => {
    process.env.FETCH_DEFAULT_HEADERS = "not-json";
    const config = loadConfig();
    expect(config.defaultHeaders).toEqual({});
  });
});
