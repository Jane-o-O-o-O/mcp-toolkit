import type { RabbitMQClient } from "./tools/types.js";
import { createRabbitMQTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type RabbitMQConfig } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  rabbitmq: RabbitMQClient;
  logger: Logger;
  config: RabbitMQConfig;
}

function encodeVhost(vhost: string): string {
  if (vhost === "/") return "%2f";
  return encodeURIComponent(vhost);
}

function createRabbitMQClient(config: RabbitMQConfig): RabbitMQClient {
  const { url, username, password } = config;

  const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

  async function rmqRequest<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const requestUrl = `${url}${path}`;
    const headers: Record<string, string> = {
      Authorization: authHeader,
      "Content-Type": "application/json",
    };

    const options: RequestInit = { method, headers };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(requestUrl, options);
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `RabbitMQ API error (${response.status}): ${errorBody}`,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  return {
    async listQueues(params) {
      const vhost = params?.vhost;
      const path = vhost
        ? `/api/queues/${encodeVhost(vhost)}`
        : "/api/queues";
      return rmqRequest("GET", path);
    },

    async getQueue(params) {
      const vhost = params.vhost ?? "/";
      const path = `/api/queues/${encodeVhost(vhost)}/${encodeURIComponent(params.name)}`;
      return rmqRequest("GET", path);
    },

    async createQueue(params) {
      const vhost = params.vhost ?? "/";
      const path = `/api/queues/${encodeVhost(vhost)}/${encodeURIComponent(params.name)}`;
      await rmqRequest("PUT", path, {
        durable: params.durable ?? true,
        auto_delete: params.auto_delete ?? false,
        arguments: params.arguments ?? {},
      });
      return {
        name: params.name,
        vhost,
        durable: params.durable ?? true,
        auto_delete: params.auto_delete ?? false,
      };
    },

    async deleteQueue(params) {
      const vhost = params.vhost ?? "/";
      const path = `/api/queues/${encodeVhost(vhost)}/${encodeURIComponent(params.name)}`;
      await rmqRequest("DELETE", path);
    },

    async listExchanges(params) {
      const vhost = params?.vhost;
      const path = vhost
        ? `/api/exchanges/${encodeVhost(vhost)}`
        : "/api/exchanges";
      return rmqRequest("GET", path);
    },

    async createExchange(params) {
      const vhost = params.vhost ?? "/";
      const path = `/api/exchanges/${encodeVhost(vhost)}/${encodeURIComponent(params.name)}`;
      await rmqRequest("PUT", path, {
        type: params.type ?? "direct",
        durable: params.durable ?? true,
        auto_delete: params.auto_delete ?? false,
        arguments: params.arguments ?? {},
      });
      return {
        name: params.name,
        vhost,
        type: params.type ?? "direct",
        durable: params.durable ?? true,
        auto_delete: params.auto_delete ?? false,
      };
    },

    async publishMessage(params) {
      const vhost = params.vhost ?? "/";
      const path = `/api/exchanges/${encodeVhost(vhost)}/${encodeURIComponent(params.exchange)}/publish`;
      return rmqRequest("POST", path, {
        routing_key: params.routing_key ?? "",
        properties: params.properties ?? {},
        payload: params.payload,
        payload_encoding: params.payload_encoding ?? "string",
      });
    },

    async listConnections() {
      return rmqRequest("GET", "/api/connections");
    },
  };
}

export async function createServerContext(
  config?: Partial<RabbitMQConfig>,
): Promise<ServerContext> {
  const fullConfig = config?.username
    ? {
        url: config.url ?? "http://localhost:15672",
        username: config.username,
        password: config.password ?? "",
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({ name: "rabbitmq", level: fullConfig.logLevel });
  const rabbitmq = createRabbitMQClient(fullConfig);
  const tools = createRabbitMQTools(rabbitmq);
  const server = createMcpServer(
    "@mcp-toolkit/rabbitmq",
    "0.1.0",
    tools,
    logger,
  );

  return { server, rabbitmq, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "RabbitMQ", {
    transport: ctx.config.transport,
    port: ctx.config.port,
  });
}
