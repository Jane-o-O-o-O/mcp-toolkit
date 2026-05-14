import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, AnsibleConfigSchema } from "../src/config.js";

describe("AnsibleConfigSchema", () => {
  it("validates with defaults", () => {
    const result = AnsibleConfigSchema.parse({});
    expect(result.playbookDir).toBe(".");
    expect(result.binary).toBe("ansible-playbook");
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
  });

  it("accepts inventory path", () => {
    const result = AnsibleConfigSchema.parse({ inventory: "/etc/ansible/hosts" });
    expect(result.inventory).toBe("/etc/ansible/hosts");
  });

  it("accepts vault password file", () => {
    const result = AnsibleConfigSchema.parse({ vaultPasswordFile: ".vault_pass" });
    expect(result.vaultPasswordFile).toBe(".vault_pass");
  });

  it("accepts private key", () => {
    const result = AnsibleConfigSchema.parse({ privateKey: "~/.ssh/id_rsa" });
    expect(result.privateKey).toBe("~/.ssh/id_rsa");
  });

  it("rejects invalid log level", () => {
    expect(() => AnsibleConfigSchema.parse({ logLevel: "verbose" })).toThrow();
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
    delete process.env.ANSIBLE_INVENTORY;
    delete process.env.ANSIBLE_PLAYBOOK_DIR;
    delete process.env.ANSIBLE_BINARY;
    delete process.env.ANSIBLE_VAULT_PASSWORD_FILE;
    delete process.env.ANSIBLE_PRIVATE_KEY;

    const config = loadConfig();
    expect(config.playbookDir).toBe(".");
    expect(config.binary).toBe("ansible-playbook");
  });

  it("loads config from environment variables", () => {
    process.env.ANSIBLE_INVENTORY = "/etc/ansible/hosts";
    process.env.ANSIBLE_PLAYBOOK_DIR = "/opt/ansible";
    process.env.ANSIBLE_VAULT_PASSWORD_FILE = ".vault_pass";
    process.env.MCP_LOG_LEVEL = "debug";

    const config = loadConfig();
    expect(config.inventory).toBe("/etc/ansible/hosts");
    expect(config.playbookDir).toBe("/opt/ansible");
    expect(config.vaultPasswordFile).toBe(".vault_pass");
    expect(config.logLevel).toBe("debug");
  });
});
