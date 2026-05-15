import type { VaultClient } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createVaultTools(client: VaultClient): McpTool[] {
  const readSecretTool: McpTool = {
    definition: {
      name: "vault_read_secret",
      description: "Read a secret from HashiCorp Vault KV v2 store. Returns the secret data and metadata.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to the secret (e.g. 'myapp/config')" },
        },
        required: ["path"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.readSecret(args.path as string),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const writeSecretTool: McpTool = {
    definition: {
      name: "vault_write_secret",
      description: "Write or update a secret in HashiCorp Vault KV v2 store.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to the secret (e.g. 'myapp/config')" },
          data: { type: "object", description: "Key-value pairs to store as the secret" },
        },
        required: ["path", "data"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.writeSecret(args.path as string, args.data as Record<string, unknown>),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const deleteSecretTool: McpTool = {
    definition: {
      name: "vault_delete_secret",
      description: "Delete the latest version of a secret from HashiCorp Vault KV v2 store.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to the secret to delete" },
        },
        required: ["path"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.deleteSecret(args.path as string),
        () => `Successfully deleted secret at '${args.path}'`,
      ),
  };

  const listSecretsTool: McpTool = {
    definition: {
      name: "vault_list_secrets",
      description: "List secret keys at a given path in HashiCorp Vault KV v2 store.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to list (e.g. 'myapp' or '' for root)" },
        },
        required: ["path"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.listSecrets(args.path as string),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const readSecretMetadataTool: McpTool = {
    definition: {
      name: "vault_read_secret_metadata",
      description: "Read metadata and version history for a secret in HashiCorp Vault KV v2 store.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to the secret" },
        },
        required: ["path"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.readSecretMetadata(args.path as string),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const listPoliciesTool: McpTool = {
    definition: {
      name: "vault_list_policies",
      description: "List all ACL policies in HashiCorp Vault.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () =>
      safeRun(
        async () => client.listPolicies(),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const readPolicyTool: McpTool = {
    definition: {
      name: "vault_read_policy",
      description: "Read an ACL policy by name from HashiCorp Vault.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name of the policy to read" },
        },
        required: ["name"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.readPolicy(args.name as string),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const getHealthTool: McpTool = {
    definition: {
      name: "vault_get_health",
      description: "Check the health status of the HashiCorp Vault server.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () =>
      safeRun(
        async () => client.getHealth(),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  return [
    readSecretTool,
    writeSecretTool,
    deleteSecretTool,
    listSecretsTool,
    readSecretMetadataTool,
    listPoliciesTool,
    readPolicyTool,
    getHealthTool,
  ];
}
