import type { LinearClient } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createLinearTools(client: LinearClient): McpTool[] {
  const listIssuesTool: McpTool = {
    definition: {
      name: "linear_list_issues",
      description:
        "List Linear issues. Optionally filter by team, project, assignee, state, and limit.",
      inputSchema: {
        type: "object",
        properties: {
          teamId: { type: "string", description: "Filter by team ID" },
          projectId: { type: "string", description: "Filter by project ID" },
          assigneeId: { type: "string", description: "Filter by assignee ID" },
          limit: { type: "number", description: "Maximum number of issues to return" },
          state: { type: "string", description: "Filter by state name" },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.listIssues({
            teamId: args.teamId as string | undefined,
            projectId: args.projectId as string | undefined,
            assigneeId: args.assigneeId as string | undefined,
            limit: args.limit as number | undefined,
            state: args.state as string | undefined,
          }),
        (issues) => JSON.stringify(issues, null, 2),
      ),
  };

  const getIssueTool: McpTool = {
    definition: {
      name: "linear_get_issue",
      description: "Get a single Linear issue by ID or identifier (e.g. PROJ-123).",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Issue ID or identifier" },
        },
        required: ["id"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.getIssue(args.id as string),
        (issue) => JSON.stringify(issue, null, 2),
      ),
  };

  const createIssueTool: McpTool = {
    definition: {
      name: "linear_create_issue",
      description: "Create a new Linear issue.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Issue title" },
          teamId: { type: "string", description: "Team ID to create the issue in" },
          description: { type: "string", description: "Issue description (Markdown)" },
          assigneeId: { type: "string", description: "Assignee user ID" },
          priority: { type: "number", description: "Priority (0=None, 1=Urgent, 2=High, 3=Medium, 4=Low)" },
          labelIds: {
            type: "array",
            items: { type: "string" },
            description: "Label IDs to apply",
          },
        },
        required: ["title", "teamId"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.createIssue({
            title: args.title as string,
            teamId: args.teamId as string,
            description: args.description as string | undefined,
            assigneeId: args.assigneeId as string | undefined,
            priority: args.priority as number | undefined,
            labelIds: args.labelIds as string[] | undefined,
          }),
        (issue) => JSON.stringify(issue, null, 2),
      ),
  };

  const updateIssueTool: McpTool = {
    definition: {
      name: "linear_update_issue",
      description: "Update an existing Linear issue.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Issue ID to update" },
          title: { type: "string", description: "New title" },
          description: { type: "string", description: "New description" },
          assigneeId: { type: "string", description: "New assignee user ID" },
          priority: { type: "number", description: "New priority level" },
          stateId: { type: "string", description: "New state ID" },
        },
        required: ["id"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.updateIssue(args.id as string, {
            title: args.title as string | undefined,
            description: args.description as string | undefined,
            assigneeId: args.assigneeId as string | undefined,
            priority: args.priority as number | undefined,
            stateId: args.stateId as string | undefined,
          }),
        (issue) => JSON.stringify(issue, null, 2),
      ),
  };

  const listProjectsTool: McpTool = {
    definition: {
      name: "linear_list_projects",
      description: "List Linear projects. Optionally filter by team and limit.",
      inputSchema: {
        type: "object",
        properties: {
          teamId: { type: "string", description: "Filter by team ID" },
          limit: { type: "number", description: "Maximum number of projects to return" },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.listProjects({
            teamId: args.teamId as string | undefined,
            limit: args.limit as number | undefined,
          }),
        (projects) => JSON.stringify(projects, null, 2),
      ),
  };

  const listTeamsTool: McpTool = {
    definition: {
      name: "linear_list_teams",
      description: "List all Linear teams.",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Maximum number of teams to return" },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.listTeams({
            limit: args.limit as number | undefined,
          }),
        (teams) => JSON.stringify(teams, null, 2),
      ),
  };

  const listLabelsTool: McpTool = {
    definition: {
      name: "linear_list_labels",
      description: "List Linear labels. Optionally filter by team.",
      inputSchema: {
        type: "object",
        properties: {
          teamId: { type: "string", description: "Filter by team ID" },
          limit: { type: "number", description: "Maximum number of labels to return" },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.listLabels({
            teamId: args.teamId as string | undefined,
            limit: args.limit as number | undefined,
          }),
        (labels) => JSON.stringify(labels, null, 2),
      ),
  };

  const listCyclesTool: McpTool = {
    definition: {
      name: "linear_list_cycles",
      description: "List Linear cycles. Optionally filter by team.",
      inputSchema: {
        type: "object",
        properties: {
          teamId: { type: "string", description: "Filter by team ID" },
          limit: { type: "number", description: "Maximum number of cycles to return" },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.listCycles({
            teamId: args.teamId as string | undefined,
            limit: args.limit as number | undefined,
          }),
        (cycles) => JSON.stringify(cycles, null, 2),
      ),
  };

  return [
    listIssuesTool,
    getIssueTool,
    createIssueTool,
    updateIssueTool,
    listProjectsTool,
    listTeamsTool,
    listLabelsTool,
    listCyclesTool,
  ];
}

export type { LinearClient } from "./types.js";
