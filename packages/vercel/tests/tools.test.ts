import { describe, it, expect, vi } from "vitest";
import { createVercelTools } from "../src/tools/index.js";
import type { VercelClient } from "../src/tools/types.js";

function mockVercelClient(overrides: Partial<VercelClient> = {}): VercelClient {
  return {
    listDeployments: vi.fn().mockResolvedValue([
      { uid: "dpl_1", name: "my-app", url: "my-app.vercel.app", state: "READY", createdAt: 1000, readyState: "READY" },
    ]),
    getDeployment: vi.fn().mockResolvedValue({
      uid: "dpl_1", name: "my-app", url: "my-app.vercel.app", state: "READY", createdAt: 1000, readyState: "READY",
    }),
    listProjects: vi.fn().mockResolvedValue([
      { id: "proj_1", name: "my-project", framework: "nextjs", createdAt: 1000 },
    ]),
    getProject: vi.fn().mockResolvedValue({
      id: "proj_1", name: "my-project", framework: "nextjs", createdAt: 1000,
    }),
    createProject: vi.fn().mockResolvedValue({
      id: "proj_2", name: "new-project", framework: "remix", createdAt: 2000,
    }),
    listEnvVars: vi.fn().mockResolvedValue([
      { id: "env_1", key: "DATABASE_URL", value: "***", target: ["production"] },
    ]),
    setEnvVar: vi.fn().mockResolvedValue({
      id: "env_2", key: "API_KEY", value: "secret", target: ["production", "preview"],
    }),
    listDomains: vi.fn().mockResolvedValue([
      { name: "example.com", verified: true, createdAt: 1000 },
    ]),
    ...overrides,
  };
}

describe("Vercel tools", () => {
  it("should have 8 tools", () => {
    const tools = createVercelTools(mockVercelClient());
    expect(tools).toHaveLength(8);
  });

  describe("vercel_list_deployments", () => {
    it("should list deployments", async () => {
      const client = mockVercelClient();
      const tools = createVercelTools(client);
      const tool = tools.find((t) => t.definition.name === "vercel_list_deployments")!;

      const result = await tool.handler({ projectId: "proj_1", limit: 10 });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("my-app");
      expect(client.listDeployments).toHaveBeenCalledWith({ projectId: "proj_1", limit: 10, target: undefined });
    });
  });

  describe("vercel_get_deployment", () => {
    it("should get deployment by id", async () => {
      const client = mockVercelClient();
      const tools = createVercelTools(client);
      const tool = tools.find((t) => t.definition.name === "vercel_get_deployment")!;

      const result = await tool.handler({ id: "dpl_1" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("dpl_1");
      expect(client.getDeployment).toHaveBeenCalledWith("dpl_1");
    });
  });

  describe("vercel_list_projects", () => {
    it("should list projects", async () => {
      const client = mockVercelClient();
      const tools = createVercelTools(client);
      const tool = tools.find((t) => t.definition.name === "vercel_list_projects")!;

      const result = await tool.handler({ limit: 5 });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("my-project");
      expect(client.listProjects).toHaveBeenCalledWith({ limit: 5 });
    });
  });

  describe("vercel_get_project", () => {
    it("should get project by id", async () => {
      const client = mockVercelClient();
      const tools = createVercelTools(client);
      const tool = tools.find((t) => t.definition.name === "vercel_get_project")!;

      const result = await tool.handler({ id: "proj_1" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("proj_1");
      expect(client.getProject).toHaveBeenCalledWith("proj_1");
    });
  });

  describe("vercel_create_project", () => {
    it("should create project", async () => {
      const client = mockVercelClient();
      const tools = createVercelTools(client);
      const tool = tools.find((t) => t.definition.name === "vercel_create_project")!;

      const result = await tool.handler({ name: "new-project", framework: "remix" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("new-project");
      expect(client.createProject).toHaveBeenCalledWith({ name: "new-project", framework: "remix" });
    });
  });

  describe("vercel_list_env_vars", () => {
    it("should list env vars", async () => {
      const client = mockVercelClient();
      const tools = createVercelTools(client);
      const tool = tools.find((t) => t.definition.name === "vercel_list_env_vars")!;

      const result = await tool.handler({ projectId: "proj_1" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("DATABASE_URL");
      expect(client.listEnvVars).toHaveBeenCalledWith("proj_1");
    });
  });

  describe("vercel_set_env_var", () => {
    it("should set env var", async () => {
      const client = mockVercelClient();
      const tools = createVercelTools(client);
      const tool = tools.find((t) => t.definition.name === "vercel_set_env_var")!;

      const result = await tool.handler({ projectId: "proj_1", key: "API_KEY", value: "secret", target: ["production", "preview"] });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("API_KEY");
      expect(client.setEnvVar).toHaveBeenCalledWith("proj_1", { key: "API_KEY", value: "secret", target: ["production", "preview"] });
    });
  });

  describe("vercel_list_domains", () => {
    it("should list domains", async () => {
      const client = mockVercelClient();
      const tools = createVercelTools(client);
      const tool = tools.find((t) => t.definition.name === "vercel_list_domains")!;

      const result = await tool.handler({ projectId: "proj_1" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("example.com");
      expect(client.listDomains).toHaveBeenCalledWith("proj_1");
    });
  });

  describe("error handling", () => {
    it("should return error on API failure", async () => {
      const client = mockVercelClient({
        listDeployments: vi.fn().mockRejectedValue(new Error("Unauthorized")),
      });
      const tools = createVercelTools(client);
      const tool = tools.find((t) => t.definition.name === "vercel_list_deployments")!;

      const result = await tool.handler({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unauthorized");
    });
  });
});
