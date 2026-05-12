import { describe, it, expect, vi } from "vitest";
import { createGitHubTools } from "../src/tools/index.js";
import type { GitHubClient } from "../src/tools/types.js";

function mockGitHubClient(overrides: Partial<GitHubClient> = {}): GitHubClient {
  return {
    request: vi.fn().mockImplementation(async (method: string, path: string) => {
      if (path.includes("/user/repos")) {
        return [
          {
            id: 1,
            name: "test-repo",
            full_name: "user/test-repo",
            description: "A test repo",
            private: false,
            html_url: "https://github.com/user/test-repo",
            stargazers_count: 42,
            forks_count: 5,
            open_issues_count: 3,
            language: "TypeScript",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ];
      }
      if (path.includes("/repos/") && path.includes("/issues") && method === "GET") {
        return [
          {
            id: 1,
            number: 1,
            title: "Test issue",
            state: "open",
            body: "Issue body",
            user: { login: "testuser" },
            labels: [{ name: "bug" }],
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
            html_url: "https://github.com/user/test-repo/issues/1",
          },
        ];
      }
      if (path.includes("/repos/") && path.includes("/pulls")) {
        return [
          {
            id: 1,
            number: 10,
            title: "Add feature",
            state: "open",
            body: null,
            user: { login: "dev" },
            head: { ref: "feature-branch" },
            base: { ref: "main" },
            merged: false,
            html_url: "https://github.com/user/test-repo/pull/10",
            created_at: "2024-01-01T00:00:00Z",
          },
        ];
      }
      if (path.includes("/search/repositories")) {
        return {
          total_count: 1,
          items: [
            {
              id: 1,
              name: "search-result",
              full_name: "org/search-result",
              description: "Found repo",
              private: false,
              html_url: "https://github.com/org/search-result",
              stargazers_count: 100,
              forks_count: 20,
              open_issues_count: 0,
              language: "Go",
              updated_at: "2024-01-01T00:00:00Z",
            },
          ],
        };
      }
      return {};
    }),
    ...overrides,
  };
}

describe("GitHub tools", () => {
  it("should have 7 tools", () => {
    const tools = createGitHubTools(mockGitHubClient());
    expect(tools).toHaveLength(7);
  });

  describe("list_repos", () => {
    it("should list user repos", async () => {
      const client = mockGitHubClient();
      const tools = createGitHubTools(client);
      const tool = tools.find((t) => t.definition.name === "list_repos")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("user/test-repo");
      expect(result.content[0].text).toContain("TypeScript");
    });
  });

  describe("get_repo", () => {
    it("should get repo details", async () => {
      const client = mockGitHubClient();
      client.request = vi.fn().mockResolvedValue({
        id: 1,
        full_name: "user/test-repo",
        description: "A test repo",
        private: false,
        html_url: "https://github.com/user/test-repo",
        stargazers_count: 42,
        forks_count: 5,
        open_issues_count: 3,
        language: "TypeScript",
        updated_at: "2024-01-01T00:00:00Z",
      });
      const tools = createGitHubTools(client);
      const tool = tools.find((t) => t.definition.name === "get_repo")!;

      const result = await tool.handler({ owner: "user", repo: "test-repo" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("user/test-repo");
    });
  });

  describe("list_issues", () => {
    it("should list open issues", async () => {
      const client = mockGitHubClient();
      const tools = createGitHubTools(client);
      const tool = tools.find((t) => t.definition.name === "list_issues")!;

      const result = await tool.handler({ owner: "user", repo: "test-repo" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Test issue");
      expect(result.content[0].text).toContain("bug");
    });
  });

  describe("get_issue", () => {
    it("should get issue details", async () => {
      const client = mockGitHubClient();
      client.request = vi.fn().mockResolvedValue({
        id: 1,
        number: 1,
        title: "Bug report",
        state: "open",
        body: "Steps to reproduce...",
        user: { login: "reporter" },
        labels: [{ name: "bug" }],
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        html_url: "https://github.com/user/repo/issues/1",
      });
      const tools = createGitHubTools(client);
      const tool = tools.find((t) => t.definition.name === "get_issue")!;

      const result = await tool.handler({ owner: "user", repo: "repo", number: 1 });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Bug report");
      expect(result.content[0].text).toContain("Steps to reproduce");
    });
  });

  describe("create_issue", () => {
    it("should create a new issue", async () => {
      const client = mockGitHubClient();
      client.request = vi.fn().mockResolvedValue({
        id: 99,
        number: 99,
        title: "New issue",
        state: "open",
        html_url: "https://github.com/user/repo/issues/99",
      });
      const tools = createGitHubTools(client);
      const tool = tools.find((t) => t.definition.name === "create_issue")!;

      const result = await tool.handler({
        owner: "user",
        repo: "repo",
        title: "New issue",
        body: "Description",
        labels: ["enhancement"],
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("99");
      expect(client.request).toHaveBeenCalledWith("POST", "/repos/user/repo/issues", {
        title: "New issue",
        body: "Description",
        labels: ["enhancement"],
      });
    });
  });

  describe("list_pull_requests", () => {
    it("should list PRs", async () => {
      const client = mockGitHubClient();
      const tools = createGitHubTools(client);
      const tool = tools.find((t) => t.definition.name === "list_pull_requests")!;

      const result = await tool.handler({ owner: "user", repo: "test-repo" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Add feature");
      expect(result.content[0].text).toContain("feature-branch");
    });
  });

  describe("search_repos", () => {
    it("should search repos", async () => {
      const client = mockGitHubClient();
      const tools = createGitHubTools(client);
      const tool = tools.find((t) => t.definition.name === "search_repos")!;

      const result = await tool.handler({ query: "mcp server" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("org/search-result");
      expect(result.content[0].text).toContain("100");
    });
  });

  describe("error handling", () => {
    it("should return error on API failure", async () => {
      const client = mockGitHubClient({
        request: vi.fn().mockRejectedValue(new Error("GitHub API GET /user/repos failed (401): Bad credentials")),
      });
      const tools = createGitHubTools(client);
      const tool = tools.find((t) => t.definition.name === "list_repos")!;

      const result = await tool.handler({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("401");
    });
  });
});
