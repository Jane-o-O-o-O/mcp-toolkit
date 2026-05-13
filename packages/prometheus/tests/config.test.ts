import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, PrometheusConfigSchema } from "../src/config.js";

describe("PrometheusConfigSchema", () => {
  it("validates a valid config", () => {
    const result = PrometheusConfigSchema.parse({
      url: "http://localhost:9090",
    });
    expect(result.url).toBe("http://localhost:9090");
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
  });

  it("accepts optional auth fields", () => {
    const result = PrometheusConfigSchema.parse({
      url: "http://localhost:9090",
      username: "admin",
      password: "secret",
    });
    expect(result.username).toBe("admin");
    expect(result.password).toBe("secret");
  });

  it("rejects invalid URL", () => {
    expect(() =>
      PrometheusConfigSchema.parse({ url: "not-a-url" }),
    ).toThrow();
  });

  it("rejects invalid log level", () => {
    expect(() =>
      PrometheusConfigSchema.parse({
        url: "http://localhost:9090",
        logLevel: "verbose",
      }),
    ).toThrow();
  });

  it("rejects invalid transport", () => {
    expect(() =>
      PrometheusConfigSchema.parse({
        url: "http://localhost:9090",
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

  it("throws when PROMETHEUS_URL is missing", () => {
    delete process.env.PROMETHEUS_URL;
    expect(() => loadConfig()).toThrow("PROMETHEUS_URL");
  });

  it("loads config from environment variables", () => {
    process.env.PROMETHEUS_URL = "http://prometheus:9090";
    process.env.PROMETHEUS_USERNAME = "admin";
    process.env.PROMETHEUS_PASSWORD = "secret";
    process.env.MCP_LOG_LEVEL = "debug";

    const config = loadConfig();
    expect(config.url).toBe("http://prometheus:9090");
    expect(config.username).toBe("admin");
    expect(config.password).toBe("secret");
    expect(config.logLevel).toBe("debug");
  });

  it("uses defaults for optional env vars", () => {
    process.env.PROMETHEUS_URL = "http://localhost:9090";
    delete process.env.PROMETHEUS_USERNAME;
    delete process.env.PROMETHEUS_PASSWORD;
    delete process.env.MCP_LOG_LEVEL;

    const config = loadConfig();
    expect(config.username).toBeUndefined();
    expect(config.password).toBeUndefined();
    expect(config.logLevel).toBe("info");
    expect(config.transport).toBe("stdio");
    expect(config.port).toBe(3000);
  });
});
