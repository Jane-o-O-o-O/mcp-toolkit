import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, DockerConfigSchema } from "../src/config.js";

describe("DockerConfigSchema", () => {
  it("validates with defaults", () => {
    const result = DockerConfigSchema.parse({});
    expect(result.socketPath).toBe("/var/run/docker.sock");
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
  });

  it("accepts custom socket path", () => {
    const result = DockerConfigSchema.parse({
      socketPath: "/var/run/docker-custom.sock",
    });
    expect(result.socketPath).toBe("/var/run/docker-custom.sock");
  });

  it("accepts remote host config", () => {
    const result = DockerConfigSchema.parse({
      host: "192.168.1.100",
      port: 2375,
    });
    expect(result.host).toBe("192.168.1.100");
    expect(result.port).toBe(2375);
  });

  it("rejects invalid log level", () => {
    expect(() =>
      DockerConfigSchema.parse({ logLevel: "verbose" }),
    ).toThrow();
  });

  it("rejects invalid transport", () => {
    expect(() =>
      DockerConfigSchema.parse({ transport: "websocket" }),
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
    delete process.env.DOCKER_SOCKET;
    delete process.env.DOCKER_HOST;
    delete process.env.DOCKER_PORT;

    const config = loadConfig();
    expect(config.socketPath).toBe("/var/run/docker.sock");
    expect(config.logLevel).toBe("info");
    expect(config.transport).toBe("stdio");
  });

  it("loads config from environment variables", () => {
    process.env.DOCKER_SOCKET = "/custom/docker.sock";
    process.env.MCP_LOG_LEVEL = "debug";

    const config = loadConfig();
    expect(config.socketPath).toBe("/custom/docker.sock");
    expect(config.logLevel).toBe("debug");
  });
});
