import type { SentryClient } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createSentryTools(client: SentryClient): McpTool[] {
  const listProjectsTool: McpTool = {
    definition: {
      name: "sentry_list_projects",
      description: "List all Sentry projects in the organization.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () =>
      safeRun(
        async () => client.listProjects(),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const getProjectTool: McpTool = {
    definition: {
      name: "sentry_get_project",
      description: "Get details of a Sentry project by slug.",
      inputSchema: {
        type: "object",
        properties: {
          projectSlug: { type: "string", description: "Project slug (e.g. my-project)" },
        },
        required: ["projectSlug"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.getProject(args.projectSlug as string),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const listIssuesTool: McpTool = {
    definition: {
      name: "sentry_list_issues",
      description: "List Sentry issues. Optionally filter by project and search query.",
      inputSchema: {
        type: "object",
        properties: {
          projectSlug: { type: "string", description: "Filter by project slug" },
          query: { type: "string", description: "Search query (e.g. is:unresolved)" },
          limit: { type: "number", description: "Maximum results (default: 10)" },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.listIssues({
            projectSlug: args.projectSlug as string | undefined,
            query: args.query as string | undefined,
            limit: args.limit as number | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const getIssueTool: McpTool = {
    definition: {
      name: "sentry_get_issue",
      description: "Get details of a Sentry issue by ID.",
      inputSchema: {
        type: "object",
        properties: {
          issueId: { type: "string", description: "Issue ID" },
        },
        required: ["issueId"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.getIssue(args.issueId as string),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const resolveIssueTool: McpTool = {
    definition: {
      name: "sentry_resolve_issue",
      description: "Mark a Sentry issue as resolved.",
      inputSchema: {
        type: "object",
        properties: {
          issueId: { type: "string", description: "Issue ID to resolve" },
        },
        required: ["issueId"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.resolveIssue(args.issueId as string),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const listEventsTool: McpTool = {
    definition: {
      name: "sentry_list_events",
      description: "List events for a Sentry project.",
      inputSchema: {
        type: "object",
        properties: {
          projectSlug: { type: "string", description: "Project slug" },
          query: { type: "string", description: "Search query" },
          limit: { type: "number", description: "Maximum results (default: 10)" },
        },
        required: ["projectSlug"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.listEvents(args.projectSlug as string, {
            query: args.query as string | undefined,
            limit: args.limit as number | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const listReleasesTool: McpTool = {
    definition: {
      name: "sentry_list_releases",
      description: "List releases for a Sentry project.",
      inputSchema: {
        type: "object",
        properties: {
          projectSlug: { type: "string", description: "Project slug" },
          limit: { type: "number", description: "Maximum results (default: 10)" },
        },
        required: ["projectSlug"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.listReleases(args.projectSlug as string, {
            limit: args.limit as number | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const createReleaseTool: McpTool = {
    definition: {
      name: "sentry_create_release",
      description: "Create a new Sentry release.",
      inputSchema: {
        type: "object",
        properties: {
          version: { type: "string", description: "Release version (e.g. v1.0.0)" },
          projects: {
            type: "array",
            items: { type: "string" },
            description: "List of project slugs",
          },
          ref: { type: "string", description: "Optional SCM reference (commit SHA)" },
        },
        required: ["version", "projects"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.createRelease({
            version: args.version as string,
            projects: args.projects as string[],
            ref: args.ref as string | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  return [
    listProjectsTool,
    getProjectTool,
    listIssuesTool,
    getIssueTool,
    resolveIssueTool,
    listEventsTool,
    listReleasesTool,
    createReleaseTool,
  ];
}
