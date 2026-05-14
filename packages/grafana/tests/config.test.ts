import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, GrafanaConfigSchema } from "../src/config.js";

describe("GrafanaConfigSchema", () => {
  it("validates with defaults", () => {
    const result = GrafanaConfigSchema.parse({ url: "http://localhost:3000" });
    expect(result.url).toBe("http://localhost:3000");
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
  });

  it("accepts api key", () => {
    const result = GrafanaConfigSchema.parse({
      url: "https://grafana.example.com",
      apiKey: "glsa_abc123",
    });
    expect(result.apiKey).toBe("glsa_abc123");
  });

  it("accepts basic auth", () => {
    const result = GrafanaConfigSchema.parse({
      url: "https://grafana.example.com",
      username: "admin",
      password: "secret",
    });
    expect(result.username).toBe("admin");
    expect(result.password).toBe("secret");
  });

  it("requires url", () => {
    expect(() => GrafanaConfigSchema.parse({})).toThrow();
  });

  it("rejects invalid url", () => {
    expect(() =>
      GrafanaConfigSchema.parse({ url: "not-a-url" }),
    ).toThrow();
  });

  it("rejects invalid log level", () => {
    expect(() =>
      GrafanaConfigSchema.parse({ url: "http://localhost:3000", logLevel: "verbose" }),
    ).toThrow();
  });

  it("rejects invalid transport", () => {
    expect(() =>
      GrafanaConfigSchema.parse({ url: "http://localhost:3000", transport: "websocket" }),
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

  it("loads config with defaults", () => {
    delete process.env.GRAFANA_URL;
    delete process.env.GRAFANA_API_KEY;
    delete process.env.GRAFANA_USERNAME;
    delete process.env.GRAFANA_PASSWORD;

    const config = loadConfig();
    expect(config.url).toBe("http://localhost:3000");
    expect(config.logLevel).toBe("info");
    expect(config.transport).toBe("stdio");
  });

  it("loads config from environment variables", () => {
    process.env.GRAFANA_URL = "https://grafana.prod.com";
    process.env.GRAFANA_API_KEY = "glsa_prod_key";
    process.env.MCP_LOG_LEVEL = "debug";

    const config = loadConfig();
    expect(config.url).toBe("https://grafana.prod.com");
    expect(config.apiKey).toBe("glsa_prod_key");
    expect(config.logLevel).toBe("debug");
  });
});
