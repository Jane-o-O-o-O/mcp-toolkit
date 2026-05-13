import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, NatsConfigSchema } from "../src/config.js";

describe("NatsConfigSchema", () => {
  it("validates with defaults", () => {
    const result = NatsConfigSchema.parse({});
    expect(result.url).toBe("nats://localhost:4222");
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
  });

  it("accepts custom URL", () => {
    const result = NatsConfigSchema.parse({ url: "nats://remote:4222" });
    expect(result.url).toBe("nats://remote:4222");
  });

  it("accepts auth fields", () => {
    const result = NatsConfigSchema.parse({
      username: "user",
      password: "pass",
    });
    expect(result.username).toBe("user");
    expect(result.password).toBe("pass");
  });

  it("accepts token auth", () => {
    const result = NatsConfigSchema.parse({
      token: "my-secret-token",
    });
    expect(result.token).toBe("my-secret-token");
  });

  it("rejects invalid log level", () => {
    expect(() =>
      NatsConfigSchema.parse({ logLevel: "verbose" }),
    ).toThrow();
  });

  it("rejects invalid transport", () => {
    expect(() =>
      NatsConfigSchema.parse({ transport: "websocket" }),
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

  it("uses default NATS_URL when not set", () => {
    delete process.env.NATS_URL;
    const config = loadConfig();
    expect(config.url).toBe("nats://localhost:4222");
  });

  it("loads config from environment variables", () => {
    process.env.NATS_URL = "nats://remote:4222";
    process.env.NATS_USERNAME = "admin";
    process.env.NATS_PASSWORD = "secret";
    process.env.MCP_LOG_LEVEL = "debug";

    const config = loadConfig();
    expect(config.url).toBe("nats://remote:4222");
    expect(config.username).toBe("admin");
    expect(config.password).toBe("secret");
    expect(config.logLevel).toBe("debug");
  });

  it("loads token auth from env", () => {
    process.env.NATS_TOKEN = "my-token";
    delete process.env.NATS_USERNAME;
    delete process.env.NATS_PASSWORD;

    const config = loadConfig();
    expect(config.token).toBe("my-token");
    expect(config.username).toBeUndefined();
  });

  it("uses defaults for optional env vars", () => {
    delete process.env.NATS_URL;
    delete process.env.NATS_USERNAME;
    delete process.env.NATS_PASSWORD;
    delete process.env.NATS_TOKEN;
    delete process.env.MCP_LOG_LEVEL;

    const config = loadConfig();
    expect(config.url).toBe("nats://localhost:4222");
    expect(config.logLevel).toBe("info");
    expect(config.transport).toBe("stdio");
    expect(config.port).toBe(3000);
  });
});
