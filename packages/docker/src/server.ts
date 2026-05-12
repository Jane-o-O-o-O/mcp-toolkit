import type { DockerClient } from "./tools/types.js";
import { createDockerTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type DockerConfig } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  docker: DockerClient;
  logger: Logger;
  config: DockerConfig;
}

/** Create a Docker client using dynamic import to handle ESM/CJS interop */
async function createDockerClient(options: { socketPath?: string; host?: string; port?: number }): Promise<DockerClient> {
  const mod = await import("dockerode");
  const Dockerode = mod.default ?? mod;
  const docker = new (Dockerode as any)(options);
  return {
    async listContainers(opts) {
      return docker.listContainers(opts) as Promise<any[]>;
    },
    getContainer(id: string) {
      const c = docker.getContainer(id);
      return {
        inspect: () => c.inspect() as Promise<any>,
        start: () => c.start() as Promise<void>,
        stop: (opts) => c.stop(opts) as Promise<void>,
        remove: (opts) => c.remove(opts) as Promise<void>,
        logs: async (opts) => {
          const stream = await c.logs({
            stdout: opts?.stdout ?? true,
            stderr: opts?.stderr ?? true,
            tail: opts?.tail ?? 100,
            follow: false,
          });
          return String(stream);
        },
      };
    },
    async listImages(opts) {
      return docker.listImages(opts) as Promise<any[]>;
    },
  };
}

export async function createServerContext(config?: Partial<DockerConfig>): Promise<ServerContext> {
  const fullConfig = config?.socketPath
    ? {
        socketPath: config.socketPath,
        host: config.host,
        dockerPort: config.dockerPort,
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({
    name: "docker",
    level: fullConfig.logLevel,
  });

  const docker = await createDockerClient({
    socketPath: fullConfig.socketPath,
    host: fullConfig.host,
    port: fullConfig.dockerPort,
  });
  const tools = createDockerTools(docker);
  const server = createMcpServer("@mcp-toolkit/docker", "0.1.0", tools, logger);

  return { server, docker, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "Docker", {
    transport: ctx.config.transport,
    port: ctx.config.port,
  });
}
