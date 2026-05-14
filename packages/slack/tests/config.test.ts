import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, SlackConfigSchema } from "../src/config.js";

describe("SlackConfigSchema", () => {
  it("validates with required botToken", () => {
    const result = SlackConfigSchema.parse({ botToken: "xoxb-123-abc" });
    expect(result.botToken).toBe("xoxb-123-abc");
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
  });

  it("rejects empty botToken", () => {
    expect(() => SlackConfigSchema.parse({ botToken: "" })).toThrow();
  });

  it("rejects missing botToken", () => {
    expect(() => SlackConfigSchema.parse({})).toThrow();
  });

  it("rejects invalid log level", () => {
    expect(() =>
      SlackConfigSchema.parse({ botToken: "xoxb-123", logLevel: "verbose" }),
    ).toThrow();
  });

  it("rejects invalid transport", () => {
    expect(() =>
      SlackConfigSchema.parse({ botToken: "xoxb-123", transport: "websocket" }),
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

  it("throws when SLACK_BOT_TOKEN is missing", () => {
    delete process.env.SLACK_BOT_TOKEN;
    expect(() => loadConfig()).toThrow("SLACK_BOT_TOKEN");
  });

  it("loads config from environment variables", () => {
    process.env.SLACK_BOT_TOKEN = "xoxb-test-token";
    process.env.MCP_LOG_LEVEL = "warn";

    const config = loadConfig();
    expect(config.botToken).toBe("xoxb-test-token");
    expect(config.logLevel).toBe("warn");
  });
});
