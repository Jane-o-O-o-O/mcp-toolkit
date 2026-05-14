import type { TerraformClient } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createTerraformTools(tf: TerraformClient): McpTool[] {
  const listWorkspacesTool: McpTool = {
    definition: {
      name: "list_workspaces",
      description: "List all Terraform workspaces and show which one is currently selected.",
      inputSchema: { type: "object", properties: {} },
    },
    handler: async () =>
      safeRun(
        async () => tf.listWorkspaces(),
        (ws) => JSON.stringify(ws, null, 2),
      ),
  };

  const selectWorkspaceTool: McpTool = {
    definition: {
      name: "select_workspace",
      description: "Switch to a different Terraform workspace.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Workspace name to switch to" },
        },
        required: ["name"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => tf.selectWorkspace(args.name as string),
        (r) => `Switched from workspace \"${r.previous}\" to \"${r.current}\""`,
      ),
  };

  const planTool: McpTool = {
    definition: {
      name: "plan",
      description: "Run terraform plan to preview infrastructure changes. Returns a summary of additions, changes, and destructions.",
      inputSchema: {
        type: "object",
        properties: {
          vars: {
            type: "object",
            description: "Terraform variables as key-value pairs",
            additionalProperties: { type: "string" },
          },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () => tf.plan(args.vars as Record<string, string> | undefined),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const applyTool: McpTool = {
    definition: {
      name: "apply",
      description: "Run terraform apply to provision infrastructure. Use with caution!",
      inputSchema: {
        type: "object",
        properties: {
          vars: {
            type: "object",
            description: "Terraform variables as key-value pairs",
            additionalProperties: { type: "string" },
          },
          auto_approve: { type: "boolean", description: "Skip interactive approval (default: false)" },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () => tf.apply(
          args.vars as Record<string, string> | undefined,
          args.auto_approve as boolean | undefined,
        ),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const destroyTool: McpTool = {
    definition: {
      name: "destroy",
      description: "Run terraform destroy to tear down infrastructure. Use with extreme caution!",
      inputSchema: {
        type: "object",
        properties: {
          vars: {
            type: "object",
            description: "Terraform variables as key-value pairs",
            additionalProperties: { type: "string" },
          },
          auto_approve: { type: "boolean", description: "Skip interactive approval (default: false)" },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () => tf.destroy(
          args.vars as Record<string, string> | undefined,
          args.auto_approve as boolean | undefined,
        ),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const outputTool: McpTool = {
    definition: {
      name: "output",
      description: "Show Terraform output values from the current state.",
      inputSchema: { type: "object", properties: {} },
    },
    handler: async () =>
      safeRun(
        async () => tf.output(),
        (outputs) => JSON.stringify(outputs, null, 2),
      ),
  };

  const stateListTool: McpTool = {
    definition: {
      name: "state_list",
      description: "List all resources in the Terraform state.",
      inputSchema: { type: "object", properties: {} },
    },
    handler: async () =>
      safeRun(
        async () => tf.stateList(),
        (resources) => resources.join("\n"),
      ),
  };

  const stateShowTool: McpTool = {
    definition: {
      name: "state_show",
      description: "Show detailed information about a specific resource in the Terraform state.",
      inputSchema: {
        type: "object",
        properties: {
          address: { type: "string", description: "Resource address (e.g. aws_instance.example)" },
        },
        required: ["address"],
      },
    },
    handler: async (args) =>
      safeRun(async () => tf.stateShow(args.address as string)),
  };

  return [
    listWorkspacesTool,
    selectWorkspaceTool,
    planTool,
    applyTool,
    destroyTool,
    outputTool,
    stateListTool,
    stateShowTool,
  ];
}
