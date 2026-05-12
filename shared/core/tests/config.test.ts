import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { parseBaseEnvVars, BaseConfigFields } from "../src/config.js";
import { z } from "zod";

describe("config", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  describe("parseBaseEnvVars", () => {
    it("should return defaults when no env vars set", () => {
      delete process.env.MCP_LOG_LEVEL;
      delete process.env.MCP_TRANSPORT;
      delete process.env.MCP_PORT;

      const result = parseBaseEnvVars();
      expect(result.logLevel).toBe("info");
      expect(result.transport).toBe("stdio");
      expect(result.port).toBe(3000);
    });

    it("should parse custom env vars", () => {
      process.env.MCP_LOG_LEVEL = "debug";
      process.env.MCP_TRANSPORT = "sse";
      process.env.MCP_PORT = "8080";

      const result = parseBaseEnvVars();
      expect(result.logLevel).toBe("debug");
      expect(result.transport).toBe("sse");
      expect(result.port).toBe(8080);
    });
  });

  describe("BaseConfigFields", () => {
    it("should be usable in a Zod schema", () => {
      const schema = z.object({
        customField: z.string(),
        ...BaseConfigFields,
      });

      const result = schema.parse({ customField: "test" });
      expect(result.customField).toBe("test");
      expect(result.logLevel).toBe("info");
      expect(result.transport).toBe("stdio");
      expect(result.port).toBe(3000);
    });

    it("should validate logLevel enum", () => {
      const schema = z.object(BaseConfigFields);
      expect(() => schema.parse({ logLevel: "invalid" })).toThrow();
    });

    it("should validate transport enum", () => {
      const schema = z.object(BaseConfigFields);
      expect(() => schema.parse({ transport: "invalid" })).toThrow();
    });
  });
});
