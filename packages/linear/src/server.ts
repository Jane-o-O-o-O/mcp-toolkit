import type { LinearClient } from "./tools/types.js";
import { createLinearTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type LinearConfig } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  client: LinearClient;
  logger: Logger;
  config: LinearConfig;
}

function graphqlRequest(
  baseUrl: string,
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<unknown> {
  return fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  }).then(async (res) => {
    const body = (await res.json()) as { data?: unknown; errors?: Array<{ message: string }> };
    if (body.errors?.length) {
      throw new Error(body.errors.map((e) => e.message).join("; "));
    }
    return body.data;
  });
}

function createLinearApiClient(config: LinearConfig): LinearClient {
  const { baseUrl, apiKey } = config;

  return {
    async listIssues(params) {
      const limit = params?.limit ?? 50;
      const filterParts: string[] = [];
      if (params?.teamId) filterParts.push(`team: { id: { eq: "${params.teamId}" } }`);
      if (params?.projectId) filterParts.push(`project: { id: { eq: "${params.projectId}" } }`);
      if (params?.assigneeId) filterParts.push(`assignee: { id: { eq: "${params.assigneeId}" } }`);
      if (params?.state) filterParts.push(`state: { name: { eq: "${params.state}" } }`);

      const filterContent = filterParts.length ? filterParts.join(", ") : "";
      const filterArg = filterContent ? `filter: { ${filterContent} }, ` : "";
      const query = `{
        issues(${filterArg}first: ${limit}) {
          nodes { id identifier title description state { name } priority assignee { name } createdAt }
        }
      }`;
      const data = (await graphqlRequest(baseUrl, apiKey, query)) as {
        issues: { nodes: Array<Record<string, unknown>> };
      };
      return data.issues.nodes.map((n) => ({
        id: n.id as string,
        identifier: n.identifier as string,
        title: n.title as string,
        description: n.description as string | undefined,
        state: (n.state as { name: string })?.name ?? "Unknown",
        priority: n.priority as number,
        assignee: (n.assignee as { name?: string })?.name,
        createdAt: n.createdAt as string,
      }));
    },

    async getIssue(id) {
      const query = `{
        issue(id: "${id}") {
          id identifier title description state { name } priority assignee { name } createdAt
        }
      }`;
      const data = (await graphqlRequest(baseUrl, apiKey, query)) as {
        issue: Record<string, unknown>;
      };
      const n = data.issue;
      return {
        id: n.id as string,
        identifier: n.identifier as string,
        title: n.title as string,
        description: n.description as string | undefined,
        state: (n.state as { name: string })?.name ?? "Unknown",
        priority: n.priority as number,
        assignee: (n.assignee as { name?: string })?.name,
        createdAt: n.createdAt as string,
      };
    },

    async createIssue(data) {
      const input: Record<string, unknown> = {
        title: data.title,
        teamId: data.teamId,
      };
      if (data.description) input.description = data.description;
      if (data.assigneeId) input.assigneeId = data.assigneeId;
      if (data.priority !== undefined) input.priority = data.priority;
      if (data.labelIds) input.labelIds = data.labelIds;

      const query = `mutation IssueCreate($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          issue { id identifier title description state { name } priority assignee { name } createdAt }
        }
      }`;
      const result = (await graphqlRequest(baseUrl, apiKey, query, { input })) as {
        issueCreate: { issue: Record<string, unknown> };
      };
      const n = result.issueCreate.issue;
      return {
        id: n.id as string,
        identifier: n.identifier as string,
        title: n.title as string,
        description: n.description as string | undefined,
        state: (n.state as { name: string })?.name ?? "Unknown",
        priority: n.priority as number,
        assignee: (n.assignee as { name?: string })?.name,
        createdAt: n.createdAt as string,
      };
    },

    async updateIssue(id, data) {
      const input: Record<string, unknown> = {};
      if (data.title !== undefined) input.title = data.title;
      if (data.description !== undefined) input.description = data.description;
      if (data.assigneeId !== undefined) input.assigneeId = data.assigneeId;
      if (data.priority !== undefined) input.priority = data.priority;
      if (data.stateId !== undefined) input.stateId = data.stateId;

      const query = `mutation IssueUpdate($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          issue { id identifier title description state { name } priority assignee { name } createdAt }
        }
      }`;
      const result = (await graphqlRequest(baseUrl, apiKey, query, { id, input })) as {
        issueUpdate: { issue: Record<string, unknown> };
      };
      const n = result.issueUpdate.issue;
      return {
        id: n.id as string,
        identifier: n.identifier as string,
        title: n.title as string,
        description: n.description as string | undefined,
        state: (n.state as { name: string })?.name ?? "Unknown",
        priority: n.priority as number,
        assignee: (n.assignee as { name?: string })?.name,
        createdAt: n.createdAt as string,
      };
    },

    async listProjects(params) {
      const limit = params?.limit ?? 50;
      const args: string[] = [`first: ${limit}`];
      if (params?.teamId) args.push(`filter: { team: { id: { eq: "${params.teamId}" } } }`);
      const query = `{
        projects(${args.join(", ")}) {
          nodes { id name description state progress }
        }
      }`;
      const data = (await graphqlRequest(baseUrl, apiKey, query)) as {
        projects: { nodes: Array<Record<string, unknown>> };
      };
      return data.projects.nodes.map((n) => ({
        id: n.id as string,
        name: n.name as string,
        description: n.description as string | undefined,
        state: n.state as string,
        progress: n.progress as number,
      }));
    },

    async listTeams(params) {
      const limit = params?.limit ?? 50;
      const query = `{
        teams(first: ${limit}) {
          nodes { id name key }
        }
      }`;
      const data = (await graphqlRequest(baseUrl, apiKey, query)) as {
        teams: { nodes: Array<Record<string, unknown>> };
      };
      return data.teams.nodes.map((n) => ({
        id: n.id as string,
        name: n.name as string,
        key: n.key as string,
      }));
    },

    async listLabels(params) {
      const limit = params?.limit ?? 50;
      const args: string[] = [`first: ${limit}`];
      if (params?.teamId) args.push(`filter: { team: { id: { eq: "${params.teamId}" } } }`);
      const query = `{
        issueLabels(${args.join(", ")}) {
          nodes { id name color }
        }
      }`;
      const data = (await graphqlRequest(baseUrl, apiKey, query)) as {
        issueLabels: { nodes: Array<Record<string, unknown>> };
      };
      return data.issueLabels.nodes.map((n) => ({
        id: n.id as string,
        name: n.name as string,
        color: n.color as string | undefined,
      }));
    },

    async listCycles(params) {
      const limit = params?.limit ?? 50;
      const args: string[] = [`first: ${limit}`];
      if (params?.teamId) args.push(`filter: { team: { id: { eq: "${params.teamId}" } } }`);
      const query = `{
        cycles(${args.join(", ")}) {
          nodes { id number name startsAt endsAt }
        }
      }`;
      const data = (await graphqlRequest(baseUrl, apiKey, query)) as {
        cycles: { nodes: Array<Record<string, unknown>> };
      };
      return data.cycles.nodes.map((n) => ({
        id: n.id as string,
        number: n.number as number,
        name: n.name as string | undefined,
        startsAt: n.startsAt as string,
        endsAt: n.endsAt as string,
      }));
    },
  };
}

export async function createServerContext(config?: Partial<LinearConfig>): Promise<ServerContext> {
  const fullConfig = config?.apiKey
    ? {
        apiKey: config.apiKey,
        baseUrl: config.baseUrl ?? "https://api.linear.app/graphql",
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({ name: "linear", level: fullConfig.logLevel });
  const client = createLinearApiClient(fullConfig);
  const tools = createLinearTools(client);
  const server = createMcpServer("@mcp-toolkit/linear", "0.1.0", tools, logger);

  return { server, client, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "Linear", {
    transport: ctx.config.transport,
    port: ctx.config.port,
  });
}
