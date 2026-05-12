import { describe, it, expect, vi } from "vitest";
import { createDockerTools } from "../src/tools/index.js";
import type { DockerClient } from "../src/tools/types.js";

function mockDockerClient(overrides: Partial<DockerClient> = {}): DockerClient {
  return {
    listContainers: vi.fn().mockResolvedValue([
      {
        Id: "abc123def456789",
        Names: ["/test-nginx"],
        Image: "nginx:latest",
        State: "running",
        Status: "Up 2 hours",
        Ports: [{ PrivatePort: 80, PublicPort: 8080, Type: "tcp" }],
        Created: 1700000000,
      },
    ]),
    getContainer: vi.fn().mockReturnValue({
      inspect: vi.fn().mockResolvedValue({
        Id: "abc123def456789",
        Name: "/test-nginx",
        Config: { Image: "nginx:latest", Cmd: ["nginx", "-g", "daemon off;"], Env: ["PATH=/usr/bin"] },
        State: { Status: "running", Running: true, Pid: 1234, StartedAt: "2024-01-01T00:00:00Z" },
        NetworkSettings: { Ports: {} },
        Mounts: [{ Type: "bind", Source: "/host/data", Destination: "/data" }],
      }),
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      logs: vi.fn().mockResolvedValue("2024-01-01 server started\n2024-01-01 listening on :80"),
    }),
    listImages: vi.fn().mockResolvedValue([
      {
        Id: "sha256:img123abc456",
        RepoTags: ["nginx:latest"],
        Size: 142000000,
        Created: 1700000000,
      },
    ]),
    ...overrides,
  };
}

describe("Docker tools", () => {
  it("should have 7 tools", () => {
    const tools = createDockerTools(mockDockerClient());
    expect(tools).toHaveLength(7);
  });

  describe("list_containers", () => {
    it("should list running containers", async () => {
      const client = mockDockerClient();
      const tools = createDockerTools(client);
      const tool = tools.find((t) => t.definition.name === "list_containers")!;

      const result = await tool.handler({ all: false });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("test-nginx");
      expect(result.content[0].text).toContain("nginx:latest");
      expect(client.listContainers).toHaveBeenCalledWith({ all: false });
    });

    it("should include stopped containers when all=true", async () => {
      const client = mockDockerClient();
      const tools = createDockerTools(client);
      const tool = tools.find((t) => t.definition.name === "list_containers")!;

      await tool.handler({ all: true });
      expect(client.listContainers).toHaveBeenCalledWith({ all: true });
    });
  });

  describe("inspect_container", () => {
    it("should return container details", async () => {
      const client = mockDockerClient();
      const tools = createDockerTools(client);
      const tool = tools.find((t) => t.definition.name === "inspect_container")!;

      const result = await tool.handler({ id: "abc123" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("test-nginx");
      expect(result.content[0].text).toContain("running");
      expect(client.getContainer).toHaveBeenCalledWith("abc123");
    });
  });

  describe("container_logs", () => {
    it("should return container logs", async () => {
      const client = mockDockerClient();
      const tools = createDockerTools(client);
      const tool = tools.find((t) => t.definition.name === "container_logs")!;

      const result = await tool.handler({ id: "abc123", tail: 50 });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("server started");
    });
  });

  describe("start_container", () => {
    it("should start a container", async () => {
      const client = mockDockerClient();
      const tools = createDockerTools(client);
      const tool = tools.find((t) => t.definition.name === "start_container")!;

      const result = await tool.handler({ id: "abc123" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("started");
      expect(client.getContainer).toHaveBeenCalledWith("abc123");
    });
  });

  describe("stop_container", () => {
    it("should stop a container", async () => {
      const client = mockDockerClient();
      const tools = createDockerTools(client);
      const tool = tools.find((t) => t.definition.name === "stop_container")!;

      const result = await tool.handler({ id: "abc123", timeout: 5 });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("stopped");
    });
  });

  describe("remove_container", () => {
    it("should remove a container", async () => {
      const client = mockDockerClient();
      const tools = createDockerTools(client);
      const tool = tools.find((t) => t.definition.name === "remove_container")!;

      const result = await tool.handler({ id: "abc123", force: false });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("removed");
    });

    it("should force remove", async () => {
      const containerMock = { remove: vi.fn().mockResolvedValue(undefined) };
      const client = mockDockerClient({
        getContainer: vi.fn().mockReturnValue(containerMock),
      });
      const tools = createDockerTools(client);
      const tool = tools.find((t) => t.definition.name === "remove_container")!;

      await tool.handler({ id: "abc123", force: true });
      expect(containerMock.remove).toHaveBeenCalledWith({ force: true });
    });
  });

  describe("list_images", () => {
    it("should list images with human-readable size", async () => {
      const client = mockDockerClient();
      const tools = createDockerTools(client);
      const tool = tools.find((t) => t.definition.name === "list_images")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("nginx:latest");
      expect(result.content[0].text).toContain("MB");
    });
  });

  describe("error handling", () => {
    it("should return error on API failure", async () => {
      const client = mockDockerClient({
        listContainers: vi.fn().mockRejectedValue(new Error("Cannot connect to Docker")),
      });
      const tools = createDockerTools(client);
      const tool = tools.find((t) => t.definition.name === "list_containers")!;

      const result = await tool.handler({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Cannot connect to Docker");
    });
  });
});
