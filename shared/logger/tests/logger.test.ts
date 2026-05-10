import { describe, it, expect, vi, beforeEach } from "vitest";
import { createLogger, type Logger, type LogLevel } from "../src/index.js";

describe("createLogger", () => {
  let stderrWrite: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderrWrite = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
  });

  it("creates a logger with default log level 'info'", () => {
    const logger = createLogger({ name: "test" });
    expect(logger).toBeDefined();
    expect(logger.level).toBe("info");
  });

  it("respects custom log level", () => {
    const logger = createLogger({ name: "test", level: "debug" });
    expect(logger.level).toBe("debug");
  });

  it("respects MCP_LOG_LEVEL env var", () => {
    const original = process.env.MCP_LOG_LEVEL;
    process.env.MCP_LOG_LEVEL = "debug";
    const logger = createLogger({ name: "test" });
    expect(logger.level).toBe("debug");
    if (original !== undefined) {
      process.env.MCP_LOG_LEVEL = original;
    } else {
      delete process.env.MCP_LOG_LEVEL;
    }
  });

  it("logs at info level by default", () => {
    const logger = createLogger({ name: "test" });
    logger.info("hello world");
    expect(stderrWrite).toHaveBeenCalledTimes(1);
    const output = stderrWrite.mock.calls[0]?.[0] as string;
    expect(output).toContain("hello world");
    expect(output).toContain("[INFO]");
    expect(output).toContain("[test]");
  });

  it("does not log debug messages when level is 'info'", () => {
    const logger = createLogger({ name: "test", level: "info" });
    logger.debug("hidden");
    expect(stderrWrite).not.toHaveBeenCalled();
  });

  it("logs debug messages when level is 'debug'", () => {
    const logger = createLogger({ name: "test", level: "debug" });
    logger.debug("visible");
    expect(stderrWrite).toHaveBeenCalledTimes(1);
    const output = stderrWrite.mock.calls[0]?.[0] as string;
    expect(output).toContain("visible");
    expect(output).toContain("[DEBUG]");
  });

  it("logs warn messages", () => {
    const logger = createLogger({ name: "test" });
    logger.warn("warning");
    expect(stderrWrite).toHaveBeenCalledTimes(1);
    const output = stderrWrite.mock.calls[0]?.[0] as string;
    expect(output).toContain("[WARN]");
  });

  it("logs error messages", () => {
    const logger = createLogger({ name: "test" });
    logger.error("oops");
    expect(stderrWrite).toHaveBeenCalledTimes(1);
    const output = stderrWrite.mock.calls[0]?.[0] as string;
    expect(output).toContain("[ERROR]");
  });

  it("includes structured context data", () => {
    const logger = createLogger({ name: "test" });
    logger.info("with data", { key: "value", count: 42 });
    const output = stderrWrite.mock.calls[0]?.[0] as string;
    expect(output).toContain('"key":"value"');
    expect(output).toContain('"count":42');
  });

  it("redacts sensitive values in context", () => {
    const logger = createLogger({ name: "test" });
    logger.info("with secret", { apiKey: "mysecret123", password: "hunter2" });
    const output = stderrWrite.mock.calls[0]?.[0] as string;
    expect(output).not.toContain("mysecret123");
    expect(output).not.toContain("hunter2");
    expect(output).toContain("[REDACTED]");
  });
});
