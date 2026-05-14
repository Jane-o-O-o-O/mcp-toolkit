import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, NotionConfigSchema } from "../src/config.js";

describe("NotionConfigSchema", () => {
  it("validates with required apiKey", () => {
    const result = NotionConfigSchema.parse({ apiKey: "secret_abc123" });
    expect(result.apiKey).toBe("secret_abc123");
    expect(result.notionVersion).toBe("2022-06-28");
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
  });

  it("accepts custom notion version", () => {
    const result = NotionConfigSchema.parse({
      apiKey: "secret_abc123",
      notionVersion: "2023-08-01",
    });
    expect(result.notionVersion).toBe("2023-08-01");
  });

  it("rejects empty apiKey", () => {
    expect(() => NotionConfigSchema.parse({ apiKey: "" })).toThrow();
  });

  it("rejects missing apiKey", () => {
    expect(() => NotionConfigSchema.parse({})).toThrow();
  });

  it("rejects invalid log level", () => {
    expect(() =>
      NotionConfigSchema.parse({ apiKey: "key", logLevel: "verbose" }),
    ).toThrow();
  });

  it("rejects invalid transport", () => {
    expect(() =>
      NotionConfigSchema.parse({ apiKey: "key", transport: "websocket" }),
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

  it("throws when NOTION_API_KEY is missing", () => {
    delete process.env.NOTION_API_KEY;
    expect(() => loadConfig()).toThrow("NOTION_API_KEY");
  });

  it("loads config from environment variables", () => {
    process.env.NOTION_API_KEY = "secret_test_key";
    process.env.MCP_LOG_LEVEL = "debug";

    const config = loadConfig();
    expect(config.apiKey).toBe("secret_test_key");
    expect(config.logLevel).toBe("debug");
    expect(config.notionVersion).toBe("2022-06-28");
  });
});
