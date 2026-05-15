import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";
import type { VercelClient } from "./types.js";

export function createVercelTools(client: VercelClient): McpTool[] {
  const listDeployments: McpTool = {
    definition: {
      name: "vercel_list_deployments",
      description: "List Vercel deployments for a project or all projects",
      inputSchema: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "Filter by project ID" },
          limit: { type: "number", description: "Max results to return" },
          target: { type: "string", description: "Deployment target (production, preview, etc.)" },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.listDeployments({
            projectId: args.projectId as string | undefined,
            limit: args.limit as number | undefined,
            target: args.target as string | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const getDeployment: McpTool = {
    definition: {
      name: "vercel_get_deployment",
      description: "Get details of a specific Vercel deployment",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Deployment ID or URL" },
        },
        required: ["id"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.getDeployment(args.id as string),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const listProjects: McpTool = {
    definition: {
      name: "vercel_list_projects",
      description: "List all Vercel projects",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max results to return" },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.listProjects({ limit: args.limit as number | undefined }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const getProject: McpTool = {
    definition: {
      name: "vercel_get_project",
      description: "Get details of a specific Vercel project",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Project ID" },
        },
        required: ["id"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.getProject(args.id as string),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const createProject: McpTool = {
    definition: {
      name: "vercel_create_project",
      description: "Create a new Vercel project",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Project name" },
          framework: { type: "string", description: "Framework preset" },
        },
        required: ["name"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.createProject({
            name: args.name as string,
            framework: args.framework as string | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const listEnvVars: McpTool = {
    definition: {
      name: "vercel_list_env_vars",
      description: "List environment variables for a Vercel project",
      inputSchema: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "Project ID" },
        },
        required: ["projectId"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.listEnvVars(args.projectId as string),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const setEnvVar: McpTool = {
    definition: {
      name: "vercel_set_env_var",
      description: "Set an environment variable for a Vercel project",
      inputSchema: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "Project ID" },
          key: { type: "string", description: "Environment variable name" },
          value: { type: "string", description: "Environment variable value" },
          target: { type: "array", items: { type: "string" }, description: "Targets (production, preview, development)" },
        },
        required: ["projectId", "key", "value"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.setEnvVar(args.projectId as string, {
            key: args.key as string,
            value: args.value as string,
            target: args.target as string[] | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const listDomains: McpTool = {
    definition: {
      name: "vercel_list_domains",
      description: "List domains for a Vercel project",
      inputSchema: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "Project ID" },
        },
        required: ["projectId"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.listDomains(args.projectId as string),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  return [listDeployments, getDeployment, listProjects, getProject, createProject, listEnvVars, setEnvVar, listDomains];
}
