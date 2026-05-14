import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, TerraformConfigSchema } from "../src/config.js";

describe("TerraformConfigSchema", () => {
  it("validates with defaults", () => {
    const result = TerraformConfigSchema.parse({});
    expect(result.workDir).toBe(".");
    expect(result.binary).toBe("terraform");
    expect(result.autoApprove).toBe(false);
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
  });

  it("accepts custom work directory", () => {
    const result = TerraformConfigSchema.parse({ workDir: "/opt/infra" });
    expect(result.workDir).toBe("/opt/infra");
  });

  it("accepts custom binary path", () => {
    const result = TerraformConfigSchema.parse({ binary: "/usr/local/bin/terraform" });
    expect(result.binary).toBe("/usr/local/bin/terraform");
  });

  it("accepts var file", () => {
    const result = TerraformConfigSchema.parse({ varFile: "prod.tfvars" });
    expect(result.varFile).toBe("prod.tfvars");
  });

  it("accepts autoApprove", () => {
    const result = TerraformConfigSchema.parse({ autoApprove: true });
    expect(result.autoApprove).toBe(true);
  });

  it("rejects invalid log level", () => {
    expect(() => TerraformConfigSchema.parse({ logLevel: "verbose" })).toThrow();
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
    delete process.env.TF_WORK_DIR;
    delete process.env.TF_BINARY;
    delete process.env.TF_VAR_FILE;
    delete process.env.TF_AUTO_APPROVE;

    const config = loadConfig();
    expect(config.workDir).toBe(".");
    expect(config.binary).toBe("terraform");
    expect(config.autoApprove).toBe(false);
  });

  it("loads config from environment variables", () => {
    process.env.TF_WORK_DIR = "/opt/infra";
    process.env.TF_BINARY = "/usr/local/bin/terraform";
    process.env.TF_VAR_FILE = "prod.tfvars";
    process.env.TF_AUTO_APPROVE = "true";
    process.env.MCP_LOG_LEVEL = "debug";

    const config = loadConfig();
    expect(config.workDir).toBe("/opt/infra");
    expect(config.binary).toBe("/usr/local/bin/terraform");
    expect(config.varFile).toBe("prod.tfvars");
    expect(config.autoApprove).toBe(true);
    expect(config.logLevel).toBe("debug");
  });
});
