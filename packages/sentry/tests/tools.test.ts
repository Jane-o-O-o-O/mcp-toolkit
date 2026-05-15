import { describe, it, expect, vi } from "vitest";
import { createSentryTools } from "../src/tools/index.js";
import type { SentryClient } from "../src/tools/types.js";

function mockSentryClient(overrides: Partial<SentryClient> = {}): SentryClient {
  return {
    listProjects: vi.fn().mockResolvedValue([
      { id: "1", slug: "my-project", name: "My Project", platform: "javascript", status: "active", dateCreated: "2024-01-01T00:00:00Z" },
      { id: "2", slug: "api-server", name: "API Server", platform: "python", status: "active", dateCreated: "2024-02-01T00:00:00Z" },
    ]),
    getProject: vi.fn().mockResolvedValue({
      id: "1", slug: "my-project", name: "My Project", platform: "javascript", status: "active", dateCreated: "2024-01-01T00:00:00Z",
    }),
    listIssues: vi.fn().mockResolvedValue([
      { id: "100", shortId: "MY-PROJ-1", title: "TypeError: Cannot read property", level: "error", status: "unresolved", count: 42, userCount: 5, firstSeen: "2024-06-01T00:00:00Z", lastSeen: "2024-06-15T12:00:00Z", project: { slug: "my-project" } },
    ]),
    getIssue: vi.fn().mockResolvedValue({
      id: "100", shortId: "MY-PROJ-1", title: "TypeError: Cannot read property", level: "error", status: "unresolved", count: 42, userCount: 5, firstSeen: "2024-06-01T00:00:00Z", lastSeen: "2024-06-15T12:00:00Z", project: { slug: "my-project" },
    }),
    resolveIssue: vi.fn().mockResolvedValue({
      id: "100", shortId: "MY-PROJ-1", title: "TypeError: Cannot read property", level: "error", status: "resolved", count: 42, userCount: 5, firstSeen: "2024-06-01T00:00:00Z", lastSeen: "2024-06-15T12:00:00Z", project: { slug: "my-project" },
    }),
    listEvents: vi.fn().mockResolvedValue([
      { id: "abc123", eventID: "abc123def456", message: "TypeError in handler", platform: "javascript", dateCreated: "2024-06-15T12:00:00Z" },
    ]),
    listReleases: vi.fn().mockResolvedValue([
      { id: "10", version: "v1.2.0", dateCreated: "2024-06-10T00:00:00Z", newGroups: 2, projects: [{ slug: "my-project" }] },
    ]),
    createRelease: vi.fn().mockResolvedValue({
      id: "11", version: "v1.3.0", ref: "abc123", dateCreated: "2024-06-15T00:00:00Z", newGroups: 0, projects: [{ slug: "my-project" }],
    }),
    ...overrides,
  };
}

describe("Sentry tools", () => {
  it("should have 8 tools", () => {
    const tools = createSentryTools(mockSentryClient());
    expect(tools).toHaveLength(8);
  });

  describe("sentry_list_projects", () => {
    it("should list projects", async () => {
      const client = mockSentryClient();
      const tools = createSentryTools(client);
      const tool = tools.find((t) => t.definition.name === "sentry_list_projects")!;
      const result = await tool.handler({});
      expect(result.isError).toBeFalsy();
      expect(client.listProjects).toHaveBeenCalled();
      expect(result.content[0].text).toContain("my-project");
    });

    it("should handle errors", async () => {
      const client = mockSentryClient({ listProjects: vi.fn().mockRejectedValue(new Error("Auth failed")) });
      const tools = createSentryTools(client);
      const tool = tools.find((t) => t.definition.name === "sentry_list_projects")!;
      const result = await tool.handler({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Auth failed");
    });
  });

  describe("sentry_get_project", () => {
    it("should get project by slug", async () => {
      const client = mockSentryClient();
      const tools = createSentryTools(client);
      const tool = tools.find((t) => t.definition.name === "sentry_get_project")!;
      const result = await tool.handler({ projectSlug: "my-project" });
      expect(result.isError).toBeFalsy();
      expect(client.getProject).toHaveBeenCalledWith("my-project");
    });
  });

  describe("sentry_list_issues", () => {
    it("should list issues with optional filters", async () => {
      const client = mockSentryClient();
      const tools = createSentryTools(client);
      const tool = tools.find((t) => t.definition.name === "sentry_list_issues")!;
      const result = await tool.handler({ projectSlug: "my-project", query: "is:unresolved", limit: 5 });
      expect(result.isError).toBeFalsy();
      expect(client.listIssues).toHaveBeenCalledWith({ projectSlug: "my-project", query: "is:unresolved", limit: 5 });
      expect(result.content[0].text).toContain("TypeError");
    });
  });

  describe("sentry_get_issue", () => {
    it("should get issue by ID", async () => {
      const client = mockSentryClient();
      const tools = createSentryTools(client);
      const tool = tools.find((t) => t.definition.name === "sentry_get_issue")!;
      const result = await tool.handler({ issueId: "100" });
      expect(result.isError).toBeFalsy();
      expect(client.getIssue).toHaveBeenCalledWith("100");
    });
  });

  describe("sentry_resolve_issue", () => {
    it("should resolve an issue", async () => {
      const client = mockSentryClient();
      const tools = createSentryTools(client);
      const tool = tools.find((t) => t.definition.name === "sentry_resolve_issue")!;
      const result = await tool.handler({ issueId: "100" });
      expect(result.isError).toBeFalsy();
      expect(client.resolveIssue).toHaveBeenCalledWith("100");
      expect(result.content[0].text).toContain("resolved");
    });
  });

  describe("sentry_list_events", () => {
    it("should list events for a project", async () => {
      const client = mockSentryClient();
      const tools = createSentryTools(client);
      const tool = tools.find((t) => t.definition.name === "sentry_list_events")!;
      const result = await tool.handler({ projectSlug: "my-project" });
      expect(result.isError).toBeFalsy();
      expect(client.listEvents).toHaveBeenCalledWith("my-project", { query: undefined, limit: undefined });
      expect(result.content[0].text).toContain("abc123");
    });
  });

  describe("sentry_list_releases", () => {
    it("should list releases", async () => {
      const client = mockSentryClient();
      const tools = createSentryTools(client);
      const tool = tools.find((t) => t.definition.name === "sentry_list_releases")!;
      const result = await tool.handler({ projectSlug: "my-project", limit: 5 });
      expect(result.isError).toBeFalsy();
      expect(client.listReleases).toHaveBeenCalledWith("my-project", { limit: 5 });
    });
  });

  describe("sentry_create_release", () => {
    it("should create a release", async () => {
      const client = mockSentryClient();
      const tools = createSentryTools(client);
      const tool = tools.find((t) => t.definition.name === "sentry_create_release")!;
      const result = await tool.handler({ version: "v1.3.0", projects: ["my-project"], ref: "abc123" });
      expect(result.isError).toBeFalsy();
      expect(client.createRelease).toHaveBeenCalledWith({ version: "v1.3.0", projects: ["my-project"], ref: "abc123" });
    });
  });

  describe("error handling", () => {
    it("should return error for failed getIssue", async () => {
      const client = mockSentryClient({ getIssue: vi.fn().mockRejectedValue(new Error("Not found")) });
      const tools = createSentryTools(client);
      const tool = tools.find((t) => t.definition.name === "sentry_get_issue")!;
      const result = await tool.handler({ issueId: "999" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Not found");
    });

    it("should return error for failed createRelease", async () => {
      const client = mockSentryClient({ createRelease: vi.fn().mockRejectedValue(new Error("Permission denied")) });
      const tools = createSentryTools(client);
      const tool = tools.find((t) => t.definition.name === "sentry_create_release")!;
      const result = await tool.handler({ version: "v1.0.0", projects: ["my-project"] });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Permission denied");
    });
  });
});
