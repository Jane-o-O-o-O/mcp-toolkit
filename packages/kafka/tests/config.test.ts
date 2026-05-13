import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, KafkaConfigSchema } from "../src/config.js";

describe("KafkaConfigSchema", () => {
  it("validates with defaults", () => {
    const result = KafkaConfigSchema.parse({ brokers: ["localhost:9092"] });
    expect(result.clientId).toBe("mcp-toolkit-kafka");
    expect(result.ssl).toBe(false);
    expect(result.sasl).toBeUndefined();
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
  });

  it("accepts multiple brokers", () => {
    const result = KafkaConfigSchema.parse({
      brokers: ["broker1:9092", "broker2:9092", "broker3:9092"],
    });
    expect(result.brokers).toHaveLength(3);
  });

  it("accepts SASL config", () => {
    const result = KafkaConfigSchema.parse({
      brokers: ["localhost:9092"],
      sasl: {
        mechanism: "scram-sha-256",
        username: "user",
        password: "pass",
      },
    });
    expect(result.sasl?.mechanism).toBe("scram-sha-256");
    expect(result.sasl?.username).toBe("user");
  });

  it("accepts custom client ID", () => {
    const result = KafkaConfigSchema.parse({
      brokers: ["localhost:9092"],
      clientId: "my-app",
    });
    expect(result.clientId).toBe("my-app");
  });

  it("rejects empty brokers array", () => {
    expect(() =>
      KafkaConfigSchema.parse({ brokers: [] }),
    ).toThrow();
  });

  it("rejects invalid SASL mechanism", () => {
    expect(() =>
      KafkaConfigSchema.parse({
        brokers: ["localhost:9092"],
        sasl: { mechanism: "invalid", username: "u", password: "p" },
      }),
    ).toThrow();
  });

  it("rejects invalid log level", () => {
    expect(() =>
      KafkaConfigSchema.parse({ brokers: ["localhost:9092"], logLevel: "verbose" }),
    ).toThrow();
  });

  it("rejects invalid transport", () => {
    expect(() =>
      KafkaConfigSchema.parse({ brokers: ["localhost:9092"], transport: "websocket" }),
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
    delete process.env.KAFKA_BROKERS;
    delete process.env.KAFKA_CLIENT_ID;
    delete process.env.KAFKA_SASL_USERNAME;
    delete process.env.KAFKA_SSL;

    const config = loadConfig();
    expect(config.brokers).toEqual(["localhost:9092"]);
    expect(config.clientId).toBe("mcp-toolkit-kafka");
    expect(config.ssl).toBe(false);
  });

  it("loads brokers from env", () => {
    process.env.KAFKA_BROKERS = "broker1:9092, broker2:9092";

    const config = loadConfig();
    expect(config.brokers).toEqual(["broker1:9092", "broker2:9092"]);
  });

  it("loads SASL from env", () => {
    process.env.KAFKA_SASL_USERNAME = "admin";
    process.env.KAFKA_SASL_PASSWORD = "secret";
    process.env.KAFKA_SASL_MECHANISM = "plain";

    const config = loadConfig();
    expect(config.sasl).toEqual({
      mechanism: "plain",
      username: "admin",
      password: "secret",
    });
  });

  it("does not set SASL if partially configured", () => {
    process.env.KAFKA_SASL_USERNAME = "admin";
    delete process.env.KAFKA_SASL_PASSWORD;
    delete process.env.KAFKA_SASL_MECHANISM;

    const config = loadConfig();
    expect(config.sasl).toBeUndefined();
  });

  it("loads SSL from env", () => {
    process.env.KAFKA_SSL = "true";

    const config = loadConfig();
    expect(config.ssl).toBe(true);
  });
});
