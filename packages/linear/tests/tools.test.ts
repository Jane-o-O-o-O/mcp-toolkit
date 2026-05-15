import { describe, it, expect, vi } from "vitest";
import { createLinearTools } from "../src/tools/index.js";
import type { LinearClient } from "../src/tools/types.js";

function mockLinearClient(overrides: Partial<LinearClient> = {}): LinearClient {
  return {
    listIssues: vi.fn().mockResolvedValue([
      {
        id: "issue-1",
        identifier: "PROJ-1",
        title: "Fix login bug",
        description: "Users cannot log in",
        state: "Todo",
        priority: 1,
        assignee: "Alice",
        createdAt: "2025-01-01T00:00:00Z",
      },
      {
        id: "issue-2",
        identifier: "PROJ-2",
        title: "Add dark mode",
        state: "In Progress",
        priority: 3,
        createdAt: "2025-01-02T00:00:00Z",
      },
    ]),
    getIssue: vi.fn().mockResolvedValue({
      id: "issue-1",
      identifier: "PROJ-1",
      title: "Fix login bug",
      description: "Users cannot log in",
      state: "Todo",
      priority: 1,
      assignee: "Alice",
      createdAt: "2025-01-01T00:00:00Z",
    }),
    createIssue: vi.fn().mockResolvedValue({
      id: "issue-3",
      identifier: "PROJ-3",
      title: "New feature",
      state: "Todo",
      priority: 2,
      createdAt: "2025-01-03T00:00:00Z",
    }),
    updateIssue: vi.fn().mockResolvedValue({
      id: "issue-1",
      identifier: "PROJ-1",
      title: "Fix login bug (updated)",
      state: "In Progress",
      priority: 1,
      assignee: "Alice",
      createdAt: "2025-01-01T00:00:00Z",
    }),
    listProjects: vi.fn().mockResolvedValue([
      { id: "proj-1", name: "Website Redesign", description: "Redesign the website", state: "active", progress: 0.5 },
      { id: "proj-2", name: "Mobile App", state: "planned", progress: 0 },
    ]),
    listTeams: vi.fn().mockResolvedValue([
      { id: "team-1", name: "Engineering", key: "ENG" },
      { id: "team-2", name: "Design", key: "DSN" },
    ]),
    listLabels: vi.fn().mockResolvedValue([
      { id: "label-1", name: "Bug", color: "#ff0000" },
      { id: "label-2", name: "Feature", color: "#00ff00" },
    ]),
    listCycles: vi.fn().mockResolvedValue([
      { id: "cycle-1", number: 1, name: "Sprint 1", startsAt: "2025-01-01T00:00:00Z", endsAt: "2025-01-14T00:00:00Z" },
      { id: "cycle-2", number: 2, startsAt: "2025-01-15T00:00:00Z", endsAt: "2025-01-28T00:00:00Z" },
    ]),
    ...overrides,
  };
}

describe("Linear tools", () => {
  it("should have 8 tools", () => {
    const tools = createLinearTools(mockLinearClient());
    expect(tools).toHaveLength(8);
  });

  describe("linear_list_issues", () => {
    it("should list issues", async () => {
      const client = mockLinearClient();
      const tools = createLinearTools(client);
      const tool = tools.find((t) => t.definition.name === "linear_list_issues")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("PROJ-1");
      expect(result.content[0].text).toContain("Fix login bug");
    });

    it("should pass filter params", async () => {
      const client = mockLinearClient();
      const tools = createLinearTools(client);
      const tool = tools.find((t) => t.definition.name === "linear_list_issues")!;

      await tool.handler({ teamId: "team-1", limit: 10 });
      expect(client.listIssues).toHaveBeenCalledWith({ teamId: "team-1", projectId: undefined, assigneeId: undefined, limit: 10, state: undefined });
    });
  });

  describe("linear_get_issue", () => {
    it("should get a single issue", async () => {
      const client = mockLinearClient();
      const tools = createLinearTools(client);
      const tool = tools.find((t) => t.definition.name === "linear_get_issue")!;

      const result = await tool.handler({ id: "issue-1" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("PROJ-1");
      expect(result.content[0].text).toContain("Fix login bug");
      expect(client.getIssue).toHaveBeenCalledWith("issue-1");
    });
  });

  describe("linear_create_issue", () => {
    it("should create an issue", async () => {
      const client = mockLinearClient();
      const tools = createLinearTools(client);
      const tool = tools.find((t) => t.definition.name === "linear_create_issue")!;

      const result = await tool.handler({ title: "New feature", teamId: "team-1", priority: 2 });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("PROJ-3");
      expect(client.createIssue).toHaveBeenCalledWith({
        title: "New feature",
        teamId: "team-1",
        description: undefined,
        assigneeId: undefined,
        priority: 2,
        labelIds: undefined,
      });
    });
  });

  describe("linear_update_issue", () => {
    it("should update an issue", async () => {
      const client = mockLinearClient();
      const tools = createLinearTools(client);
      const tool = tools.find((t) => t.definition.name === "linear_update_issue")!;

      const result = await tool.handler({ id: "issue-1", title: "Fix login bug (updated)" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Fix login bug (updated)");
      expect(client.updateIssue).toHaveBeenCalledWith("issue-1", {
        title: "Fix login bug (updated)",
        description: undefined,
        assigneeId: undefined,
        priority: undefined,
        stateId: undefined,
      });
    });
  });

  describe("linear_list_projects", () => {
    it("should list projects", async () => {
      const client = mockLinearClient();
      const tools = createLinearTools(client);
      const tool = tools.find((t) => t.definition.name === "linear_list_projects")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Website Redesign");
      expect(result.content[0].text).toContain("Mobile App");
    });
  });

  describe("linear_list_teams", () => {
    it("should list teams", async () => {
      const client = mockLinearClient();
      const tools = createLinearTools(client);
      const tool = tools.find((t) => t.definition.name === "linear_list_teams")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Engineering");
      expect(result.content[0].text).toContain("ENG");
    });
  });

  describe("linear_list_labels", () => {
    it("should list labels", async () => {
      const client = mockLinearClient();
      const tools = createLinearTools(client);
      const tool = tools.find((t) => t.definition.name === "linear_list_labels")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Bug");
      expect(result.content[0].text).toContain("Feature");
    });
  });

  describe("linear_list_cycles", () => {
    it("should list cycles", async () => {
      const client = mockLinearClient();
      const tools = createLinearTools(client);
      const tool = tools.find((t) => t.definition.name === "linear_list_cycles")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Sprint 1");
    });
  });

  describe("error handling", () => {
    it("should return error on API failure", async () => {
      const client = mockLinearClient({
        listIssues: vi.fn().mockRejectedValue(new Error("Unauthorized")),
      });
      const tools = createLinearTools(client);
      const tool = tools.find((t) => t.definition.name === "linear_list_issues")!;

      const result = await tool.handler({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unauthorized");
    });
  });
});
