import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, S3ConfigSchema } from "../src/config.js";

describe("S3ConfigSchema", () => {
  it("validates with required fields", () => {
    const result = S3ConfigSchema.parse({
      accessKeyId: "AKIAIOSFODNN7EXAMPLE",
      secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    });
    expect(result.region).toBe("us-east-1");
    expect(result.forcePathStyle).toBe(true);
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
  });

  it("accepts custom endpoint for MinIO", () => {
    const result = S3ConfigSchema.parse({
      endpoint: "http://localhost:9000",
      accessKeyId: "minioadmin",
      secretAccessKey: "minioadmin",
    });
    expect(result.endpoint).toBe("http://localhost:9000");
  });

  it("accepts custom region", () => {
    const result = S3ConfigSchema.parse({
      region: "eu-west-1",
      accessKeyId: "AKIAIOSFODNN7EXAMPLE",
      secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    });
    expect(result.region).toBe("eu-west-1");
  });

  it("rejects missing accessKeyId", () => {
    expect(() =>
      S3ConfigSchema.parse({ secretAccessKey: "secret" }),
    ).toThrow();
  });

  it("rejects missing secretAccessKey", () => {
    expect(() =>
      S3ConfigSchema.parse({ accessKeyId: "key" }),
    ).toThrow();
  });

  it("allows disabling path style", () => {
    const result = S3ConfigSchema.parse({
      accessKeyId: "key",
      secretAccessKey: "secret",
      forcePathStyle: false,
    });
    expect(result.forcePathStyle).toBe(false);
  });

  it("rejects invalid log level", () => {
    expect(() =>
      S3ConfigSchema.parse({
        accessKeyId: "key",
        secretAccessKey: "secret",
        logLevel: "verbose",
      }),
    ).toThrow();
  });

  it("rejects invalid transport", () => {
    expect(() =>
      S3ConfigSchema.parse({
        accessKeyId: "key",
        secretAccessKey: "secret",
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

  it("loads config from environment variables", () => {
    process.env.S3_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE";
    process.env.S3_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
    process.env.S3_REGION = "ap-southeast-1";
    process.env.S3_ENDPOINT = "http://localhost:9000";

    const config = loadConfig();
    expect(config.accessKeyId).toBe("AKIAIOSFODNN7EXAMPLE");
    expect(config.secretAccessKey).toBe("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY");
    expect(config.region).toBe("ap-southeast-1");
    expect(config.endpoint).toBe("http://localhost:9000");
  });

  it("uses defaults when env vars are not set", () => {
    process.env.S3_ACCESS_KEY_ID = "key";
    process.env.S3_SECRET_ACCESS_KEY = "secret";
    delete process.env.S3_REGION;
    delete process.env.S3_ENDPOINT;
    delete process.env.S3_FORCE_PATH_STYLE;

    const config = loadConfig();
    expect(config.region).toBe("us-east-1");
    expect(config.endpoint).toBeUndefined();
    expect(config.forcePathStyle).toBe(true);
  });

  it("fails without required credentials", () => {
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;
    expect(() => loadConfig()).toThrow();
  });
});
