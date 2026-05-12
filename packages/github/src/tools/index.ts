import type { GitHubClient, GitHubRepo, GitHubIssue, GitHubPR } from "./types.js";
import type { McpTool, ToolResult } from "@mcp-toolkit/core";
import { textResult, errorResult } from "@mcp-toolkit/core";

function safeRun<T>(fn: () => Promise<T>, format?: (r: T) => string): Promise<ToolResult> {
  return fn()
    .then((r) => (format ? textResult(format(r)) : textResult(String(r))))
    .catch((err) => errorResult(err instanceof Error ? err.message : String(err)));
}

export function createGitHubTools(gh: GitHubClient): McpTool[] {
  const listReposTool: McpTool = {
    definition: {
      name: "list_repos",
      description: "List repositories for the authenticated user. Returns repo name, description, stars, and language.",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string", description: "GitHub username or org (default: authenticated user)" },
          sort: { type: "string", description: "Sort by: created, updated, pushed, full_name (default: updated)" },
          per_page: { type: "number", description: "Results per page (default: 20, max: 100)" },
        },
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const owner = args.owner as string;
          const sort = (args.sort as string) ?? "updated";
          const perPage = (args.per_page as number) ?? 20;
          const path = owner
            ? `/users/${owner}/repos?sort=${sort}&per_page=${perPage}`
            : `/user/repos?sort=${sort}&per_page=${perPage}`;
          const repos = (await gh.request("GET", path)) as GitHubRepo[];
          return repos.map((r) => ({
            name: r.full_name,
            description: r.description ?? "",
            stars: r.stargazers_count,
            forks: r.forks_count,
            openIssues: r.open_issues_count,
            language: r.language,
            private: r.private,
            updated: r.updated_at,
          }));
        },
        (rows) => JSON.stringify(rows, null, 2),
      );
    },
  };

  const getRepoTool: McpTool = {
    definition: {
      name: "get_repo",
      description: "Get detailed information about a specific repository.",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
        },
        required: ["owner", "repo"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const repo = (await gh.request("GET", `/repos/${args.owner}/${args.repo}`)) as GitHubRepo;
          return {
            name: repo.full_name,
            description: repo.description,
            private: repo.private,
            url: repo.html_url,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            openIssues: repo.open_issues_count,
            language: repo.language,
            updated: repo.updated_at,
          };
        },
        (info) => JSON.stringify(info, null, 2),
      );
    },
  };

  const listIssuesTool: McpTool = {
    definition: {
      name: "list_issues",
      description: "List issues for a repository. Filter by state (open, closed, all).",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          state: { type: "string", description: "Issue state: open, closed, all (default: open)" },
          per_page: { type: "number", description: "Results per page (default: 20)" },
        },
        required: ["owner", "repo"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const state = (args.state as string) ?? "open";
          const perPage = (args.per_page as number) ?? 20;
          const issues = (await gh.request(
            "GET",
            `/repos/${args.owner}/${args.repo}/issues?state=${state}&per_page=${perPage}`,
          )) as GitHubIssue[];
          return issues
            .filter((i) => !("pull_request" in i)) // filter out PRs
            .map((i) => ({
              number: i.number,
              title: i.title,
              state: i.state,
              author: i.user.login,
              labels: i.labels.map((l) => l.name),
              created: i.created_at,
              url: i.html_url,
            }));
        },
        (rows) => JSON.stringify(rows, null, 2),
      );
    },
  };

  const getIssueTool: McpTool = {
    definition: {
      name: "get_issue",
      description: "Get detailed information about a specific issue including body text.",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          number: { type: "number", description: "Issue number" },
        },
        required: ["owner", "repo", "number"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const issue = (await gh.request(
            "GET",
            `/repos/${args.owner}/${args.repo}/issues/${args.number}`,
          )) as GitHubIssue;
          return {
            number: issue.number,
            title: issue.title,
            state: issue.state,
            author: issue.user.login,
            body: issue.body?.slice(0, 2000) ?? "",
            labels: issue.labels.map((l) => l.name),
            created: issue.created_at,
            updated: issue.updated_at,
            url: issue.html_url,
          };
        },
        (info) => JSON.stringify(info, null, 2),
      );
    },
  };

  const createIssueTool: McpTool = {
    definition: {
      name: "create_issue",
      description: "Create a new issue in a repository.",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          title: { type: "string", description: "Issue title" },
          body: { type: "string", description: "Issue body (markdown)" },
          labels: { type: "array", items: { type: "string" }, description: "Labels to add" },
        },
        required: ["owner", "repo", "title"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const issue = (await gh.request("POST", `/repos/${args.owner}/${args.repo}/issues`, {
            title: args.title,
            body: args.body ?? "",
            labels: args.labels ?? [],
          })) as GitHubIssue;
          return {
            number: issue.number,
            title: issue.title,
            url: issue.html_url,
            state: issue.state,
          };
        },
        (info) => JSON.stringify(info, null, 2),
      );
    },
  };

  const listPRsTool: McpTool = {
    definition: {
      name: "list_pull_requests",
      description: "List pull requests for a repository.",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          state: { type: "string", description: "PR state: open, closed, all (default: open)" },
          per_page: { type: "number", description: "Results per page (default: 20)" },
        },
        required: ["owner", "repo"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const state = (args.state as string) ?? "open";
          const perPage = (args.per_page as number) ?? 20;
          const prs = (await gh.request(
            "GET",
            `/repos/${args.owner}/${args.repo}/pulls?state=${state}&per_page=${perPage}`,
          )) as GitHubPR[];
          return prs.map((pr) => ({
            number: pr.number,
            title: pr.title,
            state: pr.state,
            author: pr.user.login,
            head: pr.head.ref,
            base: pr.base.ref,
            merged: pr.merged,
            url: pr.html_url,
            created: pr.created_at,
          }));
        },
        (rows) => JSON.stringify(rows, null, 2),
      );
    },
  };

  const searchReposTool: McpTool = {
    definition: {
      name: "search_repos",
      description: "Search GitHub repositories by keyword.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query (GitHub search syntax)" },
          sort: { type: "string", description: "Sort by: stars, forks, updated (default: best match)" },
          per_page: { type: "number", description: "Results per page (default: 10)" },
        },
        required: ["query"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const sort = args.sort ? `&sort=${args.sort}` : "";
          const perPage = (args.per_page as number) ?? 10;
          const result = (await gh.request(
            "GET",
            `/search/repositories?q=${encodeURIComponent(args.query as string)}${sort}&per_page=${perPage}`,
          )) as { items: GitHubRepo[]; total_count: number };
          return {
            totalCount: result.total_count,
            repos: result.items.map((r) => ({
              name: r.full_name,
              description: r.description ?? "",
              stars: r.stargazers_count,
              language: r.language,
              updated: r.updated_at,
            })),
          };
        },
        (data) => JSON.stringify(data, null, 2),
      );
    },
  };

  return [listReposTool, getRepoTool, listIssuesTool, getIssueTool, createIssueTool, listPRsTool, searchReposTool];
}
