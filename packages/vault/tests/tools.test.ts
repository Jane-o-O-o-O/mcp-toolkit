import { describe, it, expect, vi } from "vitest";
import { createVaultTools } from "../src/tools/index.js";
import type { VaultClient } from "../src/tools/types.js";

function mockVaultClient(overrides: Partial<VaultClient> = {}): VaultClient {
  return {
    readSecret: vi.fn().mockResolvedValue({
      data: {
        data: { username: "admin", password: "s3cret" },
        metadata: {
          created_time: "2024-01-01T00:00:00Z",
          deletion_time: "",
          destroyed: false,
          version: 1,
        },
      },
    }),
    writeSecret: vi.fn().mockResolvedValue({
      data: {
        data: { username: "admin", password: "new-s3cret" },
        metadata: {
          created_time: "2024-01-02T00:00:00Z",
          deletion_time: "",
          destroyed: false,
          version: 2,
        },
      },
    }),
    deleteSecret: vi.fn().mockResolvedValue(undefined),
    listSecrets: vi.fn().mockResolvedValue({
      data: {
        keys: ["app1", "app2", "db/"],
      },
    }),
    readSecretMetadata: vi.fn().mockResolvedValue({
      data: {
        created_time: "2024-01-01T00:00:00Z",
        current_version: 2,
        max_versions: 5,
        oldest_version: 1,
        updated_time: "2024-01-02T00:00:00Z",
        versions: {
          "1": { created_time: "2024-01-01T00:00:00Z", deletion_time: "", destroyed: false },
          "2": { created_time: "2024-01-02T00:00:00Z", deletion_time: "", destroyed: false },
        },
      },
    }),
    listPolicies: vi.fn().mockResolvedValue({
      data: {
        keys: ["default", "myapp-policy", "admin-policy"],
        policies: ["default", "myapp-policy", "admin-policy"],
      },
    }),
    readPolicy: vi.fn().mockResolvedValue({
      data: {
        name: "myapp-policy",
        rules: 'path "secret/data/myapp/*" { capabilities = ["read", "list"] }',
      },
    }),
    getHealth: vi.fn().mockResolvedValue({
      initialized: true,
      sealed: false,
      standby: false,
      performance_standby: false,
      replication_performance_mode: "disabled",
      replication_dr_mode: "disabled",
      server_time_utc: 1700000000,
      version: "1.15.0",
      cluster_name: "vault-cluster",
      cluster_id: "cluster-001",
    }),
    ...overrides,
  };
}

describe("Vault tools", () => {
  it("should have 8 tools", () => {
    const tools = createVaultTools(mockVaultClient());
    expect(tools).toHaveLength(8);
  });

  describe("vault_read_secret", () => {
    it("should read a secret", async () => {
      const client = mockVaultClient();
      const tools = createVaultTools(client);
      const tool = tools.find((t) => t.definition.name === "vault_read_secret")!;

      const result = await tool.handler({ path: "myapp/config" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("admin");
      expect(result.content[0].text).toContain("s3cret");
      expect(client.readSecret).toHaveBeenCalledWith("myapp/config");
    });

    it("should return error on API failure", async () => {
      const client = mockVaultClient({
        readSecret: vi.fn().mockRejectedValue(new Error("Permission denied")),
      });
      const tools = createVaultTools(client);
      const tool = tools.find((t) => t.definition.name === "vault_read_secret")!;

      const result = await tool.handler({ path: "forbidden/path" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Permission denied");
    });
  });

  describe("vault_write_secret", () => {
    it("should write a secret", async () => {
      const client = mockVaultClient();
      const tools = createVaultTools(client);
      const tool = tools.find((t) => t.definition.name === "vault_write_secret")!;

      const result = await tool.handler({ path: "myapp/config", data: { username: "admin", password: "new-s3cret" } });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("new-s3cret");
      expect(result.content[0].text).toContain("version");
      expect(client.writeSecret).toHaveBeenCalledWith("myapp/config", { username: "admin", password: "new-s3cret" });
    });

    it("should return error on write failure", async () => {
      const client = mockVaultClient({
        writeSecret: vi.fn().mockRejectedValue(new Error("Vault sealed")),
      });
      const tools = createVaultTools(client);
      const tool = tools.find((t) => t.definition.name === "vault_write_secret")!;

      const result = await tool.handler({ path: "myapp/config", data: { key: "val" } });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Vault sealed");
    });
  });

  describe("vault_delete_secret", () => {
    it("should delete a secret", async () => {
      const client = mockVaultClient();
      const tools = createVaultTools(client);
      const tool = tools.find((t) => t.definition.name === "vault_delete_secret")!;

      const result = await tool.handler({ path: "myapp/config" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Successfully deleted");
      expect(client.deleteSecret).toHaveBeenCalledWith("myapp/config");
    });

    it("should return error on delete failure", async () => {
      const client = mockVaultClient({
        deleteSecret: vi.fn().mockRejectedValue(new Error("Secret not found")),
      });
      const tools = createVaultTools(client);
      const tool = tools.find((t) => t.definition.name === "vault_delete_secret")!;

      const result = await tool.handler({ path: "nonexistent/path" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Secret not found");
    });
  });

  describe("vault_list_secrets", () => {
    it("should list secrets", async () => {
      const client = mockVaultClient();
      const tools = createVaultTools(client);
      const tool = tools.find((t) => t.definition.name === "vault_list_secrets")!;

      const result = await tool.handler({ path: "myapp" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("app1");
      expect(result.content[0].text).toContain("app2");
      expect(client.listSecrets).toHaveBeenCalledWith("myapp");
    });

    it("should return error on list failure", async () => {
      const client = mockVaultClient({
        listSecrets: vi.fn().mockRejectedValue(new Error("Permission denied")),
      });
      const tools = createVaultTools(client);
      const tool = tools.find((t) => t.definition.name === "vault_list_secrets")!;

      const result = await tool.handler({ path: "forbidden" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Permission denied");
    });
  });

  describe("vault_read_secret_metadata", () => {
    it("should read secret metadata", async () => {
      const client = mockVaultClient();
      const tools = createVaultTools(client);
      const tool = tools.find((t) => t.definition.name === "vault_read_secret_metadata")!;

      const result = await tool.handler({ path: "myapp/config" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("current_version");
      expect(result.content[0].text).toContain("2");
      expect(client.readSecretMetadata).toHaveBeenCalledWith("myapp/config");
    });

    it("should return error on metadata read failure", async () => {
      const client = mockVaultClient({
        readSecretMetadata: vi.fn().mockRejectedValue(new Error("Secret not found")),
      });
      const tools = createVaultTools(client);
      const tool = tools.find((t) => t.definition.name === "vault_read_secret_metadata")!;

      const result = await tool.handler({ path: "nonexistent" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Secret not found");
    });
  });

  describe("vault_list_policies", () => {
    it("should list policies", async () => {
      const client = mockVaultClient();
      const tools = createVaultTools(client);
      const tool = tools.find((t) => t.definition.name === "vault_list_policies")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("default");
      expect(result.content[0].text).toContain("myapp-policy");
      expect(client.listPolicies).toHaveBeenCalled();
    });

    it("should return error on list policies failure", async () => {
      const client = mockVaultClient({
        listPolicies: vi.fn().mockRejectedValue(new Error("Connection refused")),
      });
      const tools = createVaultTools(client);
      const tool = tools.find((t) => t.definition.name === "vault_list_policies")!;

      const result = await tool.handler({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Connection refused");
    });
  });

  describe("vault_read_policy", () => {
    it("should read a policy", async () => {
      const client = mockVaultClient();
      const tools = createVaultTools(client);
      const tool = tools.find((t) => t.definition.name === "vault_read_policy")!;

      const result = await tool.handler({ name: "myapp-policy" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("myapp-policy");
      expect(result.content[0].text).toContain("secret/data/myapp");
      expect(client.readPolicy).toHaveBeenCalledWith("myapp-policy");
    });

    it("should return error on read policy failure", async () => {
      const client = mockVaultClient({
        readPolicy: vi.fn().mockRejectedValue(new Error("Policy not found")),
      });
      const tools = createVaultTools(client);
      const tool = tools.find((t) => t.definition.name === "vault_read_policy")!;

      const result = await tool.handler({ name: "nonexistent" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Policy not found");
    });
  });

  describe("vault_get_health", () => {
    it("should get vault health", async () => {
      const client = mockVaultClient();
      const tools = createVaultTools(client);
      const tool = tools.find((t) => t.definition.name === "vault_get_health")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("initialized");
      expect(result.content[0].text).toContain("1.15.0");
      expect(client.getHealth).toHaveBeenCalled();
    });

    it("should return error on health check failure", async () => {
      const client = mockVaultClient({
        getHealth: vi.fn().mockRejectedValue(new Error("Service unavailable")),
      });
      const tools = createVaultTools(client);
      const tool = tools.find((t) => t.definition.name === "vault_get_health")!;

      const result = await tool.handler({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Service unavailable");
    });
  });
});
