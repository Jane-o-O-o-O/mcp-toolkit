import type { DockerClient } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createDockerTools(docker: DockerClient): McpTool[] {
  const listContainersTool: McpTool = {
    definition: {
      name: "list_containers",
      description: "List Docker containers. By default shows only running containers. Use all=true to include stopped ones.",
      inputSchema: {
        type: "object",
        properties: {
          all: { type: "boolean", description: "Include stopped containers (default: false)" },
        },
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const containers = await docker.listContainers({ all: args.all as boolean });
          return containers.map((c) => ({
            id: c.Id.slice(0, 12),
            name: c.Names[0]?.replace(/^\//, "") ?? "",
            image: c.Image,
            state: c.State,
            status: c.Status,
            ports: c.Ports.map((p) => `${p.PublicPort ?? ""}:${p.PrivatePort}/${p.Type}`).join(", "),
          }));
        },
        (rows) => JSON.stringify(rows, null, 2),
      );
    },
  };

  const inspectContainerTool: McpTool = {
    definition: {
      name: "inspect_container",
      description: "Get detailed information about a container (config, state, network, mounts).",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Container ID or name" },
        },
        required: ["id"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const container = docker.getContainer(args.id as string);
          const detail = await container.inspect();
          return {
            id: detail.Id.slice(0, 12),
            name: detail.Name.replace(/^\//, ""),
            image: detail.Config.Image,
            state: detail.State.Status,
            running: detail.State.Running,
            pid: detail.State.Pid,
            startedAt: detail.State.StartedAt,
            cmd: detail.Config.Cmd,
            env: detail.Config.Env?.slice(0, 5),
            mounts: detail.Mounts.map((m) => `${m.Type}: ${m.Source} → ${m.Destination}`),
          };
        },
        (info) => JSON.stringify(info, null, 2),
      );
    },
  };

  const containerLogsTool: McpTool = {
    definition: {
      name: "container_logs",
      description: "Get recent logs from a container (last N lines).",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Container ID or name" },
          tail: { type: "number", description: "Number of log lines to return (default: 100)" },
        },
        required: ["id"],
      },
    },
    handler: async (args) => {
      return safeRun(async () => {
        const container = docker.getContainer(args.id as string);
        return await container.logs({ stdout: true, stderr: true, tail: (args.tail as number) ?? 100 });
      });
    },
  };

  const startContainerTool: McpTool = {
    definition: {
      name: "start_container",
      description: "Start a stopped container.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Container ID or name" },
        },
        required: ["id"],
      },
    },
    handler: async (args) => {
      return safeRun(async () => {
        const container = docker.getContainer(args.id as string);
        await container.start();
        return `Container ${args.id} started`;
      });
    },
  };

  const stopContainerTool: McpTool = {
    definition: {
      name: "stop_container",
      description: "Stop a running container with optional timeout.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Container ID or name" },
          timeout: { type: "number", description: "Seconds to wait before killing (default: 10)" },
        },
        required: ["id"],
      },
    },
    handler: async (args) => {
      return safeRun(async () => {
        const container = docker.getContainer(args.id as string);
        await container.stop({ t: (args.timeout as number) ?? 10 });
        return `Container ${args.id} stopped`;
      });
    },
  };

  const removeContainerTool: McpTool = {
    definition: {
      name: "remove_container",
      description: "Remove a container. Use force=true to force-remove running containers.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Container ID or name" },
          force: { type: "boolean", description: "Force removal of running container" },
        },
        required: ["id"],
      },
    },
    handler: async (args) => {
      return safeRun(async () => {
        const container = docker.getContainer(args.id as string);
        await container.remove({ force: args.force as boolean });
        return `Container ${args.id} removed`;
      });
    },
  };

  const listImagesTool: McpTool = {
    definition: {
      name: "list_images",
      description: "List Docker images with tags and sizes.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () => {
      return safeRun(
        async () => {
          const images = await docker.listImages();
          return images.map((img) => ({
            id: img.Id.replace("sha256:", "").slice(0, 12),
            tags: img.RepoTags ?? ["<none>"],
            size: `${(img.Size / 1024 / 1024).toFixed(1)} MB`,
            created: new Date(img.Created * 1000).toISOString(),
          }));
        },
        (rows) => JSON.stringify(rows, null, 2),
      );
    },
  };

  return [
    listContainersTool,
    inspectContainerTool,
    containerLogsTool,
    startContainerTool,
    stopContainerTool,
    removeContainerTool,
    listImagesTool,
  ];
}
