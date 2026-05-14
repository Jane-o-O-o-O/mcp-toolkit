import type { AnsibleClient } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createAnsibleTools(ansible: AnsibleClient): McpTool[] {
  const runPlaybookTool: McpTool = {
    definition: {
      name: "run_playbook",
      description: "Run an Ansible playbook with optional inventory, extra vars, and host limit.",
      inputSchema: {
        type: "object",
        properties: {
          playbook: { type: "string", description: "Path to playbook file (e.g. site.yml)" },
          inventory: { type: "string", description: "Inventory file or comma-separated host list" },
          extra_vars: { type: "object", description: "Extra variables as key-value pairs", additionalProperties: { type: "string" } },
          limit: { type: "string", description: "Limit to specific hosts or groups" },
        },
        required: ["playbook"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => ansible.runPlaybook(
          args.playbook as string,
          args.inventory as string | undefined,
          args.extra_vars as Record<string, string> | undefined,
          args.limit as string | undefined,
        ),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const listHostsTool: McpTool = {
    definition: {
      name: "list_hosts",
      description: "List all hosts in the Ansible inventory, optionally filtered by pattern.",
      inputSchema: {
        type: "object",
        properties: {
          inventory: { type: "string", description: "Inventory file or directory" },
          pattern: { type: "string", description: "Host pattern filter (e.g. 'webservers', 'db:*')" },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () => ansible.listHosts(
          args.inventory as string | undefined,
          args.pattern as string | undefined,
        ),
        (hosts) => JSON.stringify(hosts, null, 2),
      ),
  };

  const runAdHocTool: McpTool = {
    definition: {
      name: "run_adhoc",
      description: "Run an Ansible ad-hoc command on managed hosts.",
      inputSchema: {
        type: "object",
        properties: {
          module: { type: "string", description: "Ansible module (e.g. ping, shell, copy, yum)" },
          args: { type: "string", description: "Module arguments" },
          hosts: { type: "string", description: "Host pattern (default: all)" },
          inventory: { type: "string", description: "Inventory file" },
        },
        required: ["module", "args"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => ansible.runAdHoc(
          args.module as string,
          args.args as string,
          args.hosts as string | undefined,
          args.inventory as string | undefined,
        ),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const listRolesTool: McpTool = {
    definition: {
      name: "list_roles",
      description: "List installed Ansible roles.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Custom roles path to search" },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () => ansible.listRoles(args.path as string | undefined),
        (roles) => JSON.stringify(roles, null, 2),
      ),
  };

  const listCollectionsTool: McpTool = {
    definition: {
      name: "list_collections",
      description: "List installed Ansible collections.",
      inputSchema: { type: "object", properties: {} },
    },
    handler: async () =>
      safeRun(
        async () => ansible.listCollections(),
        (cols) => JSON.stringify(cols, null, 2),
      ),
  };

  const vaultEncryptTool: McpTool = {
    definition: {
      name: "vault_encrypt",
      description: "Encrypt a string using Ansible Vault.",
      inputSchema: {
        type: "object",
        properties: {
          content: { type: "string", description: "Content to encrypt" },
          vault_id: { type: "string", description: "Vault ID label" },
        },
        required: ["content"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => ansible.vaultEncrypt(
          args.content as string,
          args.vault_id as string | undefined,
        ),
        (encrypted) => encrypted,
      ),
  };

  const vaultDecryptTool: McpTool = {
    definition: {
      name: "vault_decrypt",
      description: "Decrypt an Ansible Vault encrypted string.",
      inputSchema: {
        type: "object",
        properties: {
          content: { type: "string", description: "Vault-encrypted content to decrypt" },
          vault_id: { type: "string", description: "Vault ID label" },
        },
        required: ["content"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => ansible.vaultDecrypt(
          args.content as string,
          args.vault_id as string | undefined,
        ),
        (decrypted) => decrypted,
      ),
  };

  const galaxyInstallTool: McpTool = {
    definition: {
      name: "galaxy_install",
      description: "Install an Ansible role or collection from Ansible Galaxy.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Role or collection name (e.g. geerlingguy.docker)" },
          type: { type: "string", enum: ["role", "collection"], description: "Type: role or collection (default: role)" },
        },
        required: ["name"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => ansible.galaxyInstall(
          args.name as string,
          (args.type as "role" | "collection") ?? "role",
        ),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  return [
    runPlaybookTool,
    listHostsTool,
    runAdHocTool,
    listRolesTool,
    listCollectionsTool,
    vaultEncryptTool,
    vaultDecryptTool,
    galaxyInstallTool,
  ];
}
