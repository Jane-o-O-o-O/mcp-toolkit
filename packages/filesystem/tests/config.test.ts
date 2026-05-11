import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FilesystemConfigSchema, loadConfig } from "../src/config.js";

describe("FilesystemConfig", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  describe("FilesystemConfigSchema", () => {
    it("should parse valid config", () => {
      const result = FilesystemConfigSchema.parse({ rootDir: "/tmp/test" });
      expect(result.rootDir).toBe("/tmp/test");
      expect(result.allowWrite).toBe(true);
      expect(result.allowDelete).toBe(false);
      expect(result.maxFileSize).toBe(10 * 1024 * 1024);
      expect(result.logLevel).toBe("info");
      expect(result.transport).toBe("stdio");
    });

    it("should require rootDir", () => {
      expect(() => FilesystemConfigSchema.parse({})).toThrow();
    });

    it("should accept custom values", () => {
      const result = FilesystemConfigSchema.parse({
        rootDir: "/data",
        allowWrite: false,
        allowDelete: true,
        maxFileSize: 1024 * 1024,
        logLevel: "debug",
      });
      expect(result.allowWrite).toBe(false);
      expect(result.allowDelete).toBe(true);
      expect(result.maxFileSize).toBe(1024 * 1024);
    });
  });

  describe("loadConfig", () => {
    it("should throw when MCP_FILESYSTEM_ROOT is not set", () => {
      delete process.env.MCP_FILESYSTEM_ROOT;
      expect(() => loadConfig()).toThrow("MCP_FILESYSTEM_ROOT");
    });

    it("should load from env vars", () => {
      process.env.MCP_FILESYSTEM_ROOT = "/home/user/docs";
      const config = loadConfig();
      expect(config.rootDir).toBe("/home/user/docs");
      expect(config.allowWrite).toBe(true);
      expect(config.allowDelete).toBe(false);
    });

    it("should parse optional env vars", () => {
      process.env.MCP_FILESYSTEM_ROOT = "/data";
      process.env.MCP_FILESYSTEM_ALLOW_WRITE = "false";
      process.env.MCP_FILESYSTEM_ALLOW_DELETE = "true";
      process.env.MCP_FILESYSTEM_MAX_FILE_SIZE = "5242880";
      process.env.MCP_LOG_LEVEL = "warn";

      const config = loadConfig();
      expect(config.allowWrite).toBe(false);
      expect(config.allowDelete).toBe(true);
      expect(config.maxFileSize).toBe(5242880);
      expect(config.logLevel).toBe("warn");
    });
  });
});
