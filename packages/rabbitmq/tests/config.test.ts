import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, RabbitMQConfigSchema } from "../src/config.js";

describe("RabbitMQConfigSchema", () => {
  it("validates with required credentials and defaults", () => {
    const result = RabbitMQConfigSchema.parse({
      username: "guest",
      password: "guest",
    });
    expect(result.username).toBe("guest");
    expect(result.password).toBe("guest");
    expect(result.url).toBe("http://localhost:15672");
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
  });

  it("accepts custom values", () => {
    const result = RabbitMQConfigSchema.parse({
      username: "admin",
      password: "secret",
      url: "https://rabbitmq.example.com:15672",
      logLevel: "debug",
      transport: "sse",
      port: 8080,
    });
    expect(result.username).toBe("admin");
    expect(result.password).toBe("secret");
    expect(result.url).toBe("https://rabbitmq.example.com:15672");
    expect(result.logLevel).toBe("debug");
    expect(result.transport).toBe("sse");
    expect(result.port).toBe(8080);
  });

  it("rejects empty username", () => {
    expect(() =>
      RabbitMQConfigSchema.parse({ username: "", password: "guest" }),
    ).toThrow();
  });

  it("rejects missing username", () => {
    expect(() => RabbitMQConfigSchema.parse({ password: "guest" })).toThrow();
  });

  it("rejects empty password", () => {
    expect(() =>
      RabbitMQConfigSchema.parse({ username: "guest", password: "" }),
    ).toThrow();
  });

  it("rejects missing password", () => {
    expect(() => RabbitMQConfigSchema.parse({ username: "guest" })).toThrow();
  });

  it("rejects invalid log level", () => {
    expect(() =>
      RabbitMQConfigSchema.parse({
        username: "guest",
        password: "guest",
        logLevel: "verbose",
      }),
    ).toThrow();
  });

  it("rejects invalid transport", () => {
    expect(() =>
      RabbitMQConfigSchema.parse({
        username: "guest",
        password: "guest",
        transport: "websocket",
      }),
    ).toThrow();
  });

  it("schema parse succeeds with valid data", () => {
    const result = RabbitMQConfigSchema.safeParse({
      username: "guest",
      password: "guest",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toBe("guest");
    }
  });

  it("schema parse fails with invalid data", () => {
    const result = RabbitMQConfigSchema.safeParse({
      username: "",
      password: "",
    });
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

  it("throws when RABBITMQ_USER is missing", () => {
    delete process.env.RABBITMQ_USER;
    process.env.RABBITMQ_PASSWORD = "guest";
    expect(() => loadConfig()).toThrow(
      "RABBITMQ_USER environment variable is required",
    );
  });

  it("throws when RABBITMQ_PASSWORD is missing", () => {
    process.env.RABBITMQ_USER = "guest";
    delete process.env.RABBITMQ_PASSWORD;
    expect(() => loadConfig()).toThrow(
      "RABBITMQ_PASSWORD environment variable is required",
    );
  });

  it("loads config from environment variables", () => {
    process.env.RABBITMQ_USER = "admin";
    process.env.RABBITMQ_PASSWORD = "secret";
    process.env.RABBITMQ_URL = "https://rabbitmq.example.com:15672";
    process.env.MCP_LOG_LEVEL = "debug";

    const config = loadConfig();
    expect(config.username).toBe("admin");
    expect(config.password).toBe("secret");
    expect(config.url).toBe("https://rabbitmq.example.com:15672");
    expect(config.logLevel).toBe("debug");
  });

  it("loads config with defaults when optional env vars are missing", () => {
    process.env.RABBITMQ_USER = "guest";
    process.env.RABBITMQ_PASSWORD = "guest";
    delete process.env.RABBITMQ_URL;

    const config = loadConfig();
    expect(config.username).toBe("guest");
    expect(config.password).toBe("guest");
    expect(config.url).toBe("http://localhost:15672");
  });
});
