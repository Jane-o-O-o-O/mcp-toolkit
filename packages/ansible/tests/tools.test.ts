import { describe, it, expect, vi } from "vitest";
import { createAnsibleTools } from "../src/tools/index.js";
import type { AnsibleClient } from "../src/tools/types.js";

function mockAnsibleClient(overrides: Partial<AnsibleClient> = {}): AnsibleClient {
  return {
    runPlaybook: vi.fn().mockResolvedValue({
      playbook: "site.yml",
      status: "success",
      plays: 2,
      tasks: 10,
      hosts: 3,
      recap: "PLAY RECAP\nweb1 : ok=10 changed=3 unreachable=0 failed=0",
      raw: "PLAY [Web Servers] ***\nTASK [Gathering Facts] ok: [web1]\nPLAY RECAP\nweb1 : ok=10 changed=3 unreachable=0 failed=0",
    }),
    listHosts: vi.fn().mockResolvedValue([
      { name: "web1.example.com", groups: ["webservers"], variables: {} },
      { name: "web2.example.com", groups: ["webservers"], variables: {} },
      { name: "db1.example.com", groups: ["databases"], variables: {} },
    ]),
    runAdHoc: vi.fn().mockResolvedValue({
      module: "ping",
      hosts: 3,
      success: 3,
      failures: 0,
      unreachable: 0,
      raw: "web1.example.com | SUCCESS => {\n    \"ping\": \"pong\"\n}",
    }),
    listRoles: vi.fn().mockResolvedValue([
      { name: "geerlingguy.docker", path: "/etc/ansible/roles", version: "6.1.0" },
      { name: "geerlingguy.nginx", path: "/etc/ansible/roles", version: "3.1.0" },
    ]),
    listCollections: vi.fn().mockResolvedValue([
      { name: "community.general", version: "8.0.0", path: "/home/user/.ansible/collections" },
      { name: "ansible.posix", version: "1.5.0", path: "/home/user/.ansible/collections" },
    ]),
    vaultEncrypt: vi.fn().mockResolvedValue("$ANSIBLE_VAULT;1.1;AES256\n616263646566..."),
    vaultDecrypt: vi.fn().mockResolvedValue("my_secret_password"),
    galaxyInstall: vi.fn().mockResolvedValue({
      name: "geerlingguy.docker",
      type: "role",
      version: "6.1.0",
      status: "installed",
    }),
    ...overrides,
  };
}

describe("Ansible tools", () => {
  it("should have 8 tools", () => {
    const tools = createAnsibleTools(mockAnsibleClient());
    expect(tools).toHaveLength(8);
  });

  describe("run_playbook", () => {
    it("should run a playbook", async () => {
      const client = mockAnsibleClient();
      const tools = createAnsibleTools(client);
      const tool = tools.find((t) => t.definition.name === "run_playbook")!;

      const result = await tool.handler({ playbook: "site.yml" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("success");
      expect(result.content[0].text).toContain("10");
      expect(client.runPlaybook).toHaveBeenCalledWith("site.yml", undefined, undefined, undefined);
    });

    it("should pass inventory and extra vars", async () => {
      const client = mockAnsibleClient();
      const tools = createAnsibleTools(client);
      const tool = tools.find((t) => t.definition.name === "run_playbook")!;

      await tool.handler({
        playbook: "deploy.yml",
        inventory: "production",
        extra_vars: { version: "2.0" },
        limit: "webservers",
      });
      expect(client.runPlaybook).toHaveBeenCalledWith("deploy.yml", "production", { version: "2.0" }, "webservers");
    });
  });

  describe("list_hosts", () => {
    it("should list hosts", async () => {
      const client = mockAnsibleClient();
      const tools = createAnsibleTools(client);
      const tool = tools.find((t) => t.definition.name === "list_hosts")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("web1.example.com");
      expect(result.content[0].text).toContain("db1.example.com");
    });
  });

  describe("run_adhoc", () => {
    it("should run ad-hoc command", async () => {
      const client = mockAnsibleClient();
      const tools = createAnsibleTools(client);
      const tool = tools.find((t) => t.definition.name === "run_adhoc")!;

      const result = await tool.handler({ module: "ping", args: "" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("pong");
    });
  });

  describe("list_roles", () => {
    it("should list installed roles", async () => {
      const client = mockAnsibleClient();
      const tools = createAnsibleTools(client);
      const tool = tools.find((t) => t.definition.name === "list_roles")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("geerlingguy.docker");
    });
  });

  describe("list_collections", () => {
    it("should list installed collections", async () => {
      const client = mockAnsibleClient();
      const tools = createAnsibleTools(client);
      const tool = tools.find((t) => t.definition.name === "list_collections")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("community.general");
    });
  });

  describe("vault_encrypt", () => {
    it("should encrypt content", async () => {
      const client = mockAnsibleClient();
      const tools = createAnsibleTools(client);
      const tool = tools.find((t) => t.definition.name === "vault_encrypt")!;

      const result = await tool.handler({ content: "my_secret" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("ANSIBLE_VAULT");
    });
  });

  describe("vault_decrypt", () => {
    it("should decrypt content", async () => {
      const client = mockAnsibleClient();
      const tools = createAnsibleTools(client);
      const tool = tools.find((t) => t.definition.name === "vault_decrypt")!;

      const result = await tool.handler({ content: "$ANSIBLE_VAULT;1.1;AES256..." });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("my_secret_password");
    });
  });

  describe("galaxy_install", () => {
    it("should install a role", async () => {
      const client = mockAnsibleClient();
      const tools = createAnsibleTools(client);
      const tool = tools.find((t) => t.definition.name === "galaxy_install")!;

      const result = await tool.handler({ name: "geerlingguy.docker" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("installed");
    });

    it("should install a collection", async () => {
      const client = mockAnsibleClient();
      const tools = createAnsibleTools(client);
      const tool = tools.find((t) => t.definition.name === "galaxy_install")!;

      await tool.handler({ name: "community.general", type: "collection" });
      expect(client.galaxyInstall).toHaveBeenCalledWith("community.general", "collection");
    });
  });

  describe("error handling", () => {
    it("should return error on failure", async () => {
      const client = mockAnsibleClient({
        runPlaybook: vi.fn().mockRejectedValue(new Error("playbook not found")),
      });
      const tools = createAnsibleTools(client);
      const tool = tools.find((t) => t.definition.name === "run_playbook")!;

      const result = await tool.handler({ playbook: "missing.yml" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("playbook not found");
    });
  });
});
