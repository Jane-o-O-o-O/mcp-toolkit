import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FilesystemConfigSchema, loadConfig } from "../src/config.js";

describe("FilesystemConfigSchema", () => {
  it("should validate a valid config", () => {
    const result = FilesystemConfigSchema.safeParse({
      allowedPaths: ["/home/user"],
      logLevel: "info",
      transport: "stdio",
      port: 3000,
      maxFileSize: 1024 * 1024,
    });
    expect(result.success).toBe(true);
  });

  it("should require at least one allowed path", () => {
    const result = FilesystemConfigSchema.safeParse({
      allowedPaths: [],
    });
    expect(result.success).toBe(false);
  });

  it("should use default values", () => {
    const result = FilesystemConfigSchema.parse({
      allowedPaths: ["/tmp"],
    });
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
    expect(result.maxFileSize).toBe(10 * 1024 * 1024);
  });

  it("should reject invalid log level", () => {
    const result = FilesystemConfigSchema.safeParse({
      allowedPaths: ["/tmp"],
      logLevel: "verbose",
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

  it("should load config from environment variables", () => {
    process.env.FILESYSTEM_ALLOWED_PATHS = "/home/user,/tmp/workspace";
    process.env.MCP_LOG_LEVEL = "debug";
    const config = loadConfig();
    expect(config.allowedPaths).toEqual(["/home/user", "/tmp/workspace"]);
    expect(config.logLevel).toBe("debug");
  });

  it("should throw when FILESYSTEM_ALLOWED_PATHS is not set", () => {
    delete process.env.FILESYSTEM_ALLOWED_PATHS;
    expect(() => loadConfig()).toThrow("FILESYSTEM_ALLOWED_PATHS");
  });

  it("should parse max file size from env", () => {
    process.env.FILESYSTEM_ALLOWED_PATHS = "/tmp";
    process.env.FILESYSTEM_MAX_FILE_SIZE = "2048";
    const config = loadConfig();
    expect(config.maxFileSize).toBe(2048);
  });
});
