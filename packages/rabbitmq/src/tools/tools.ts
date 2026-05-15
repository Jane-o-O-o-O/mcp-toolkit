import type { RabbitMQClient } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createRabbitMQTools(client: RabbitMQClient): McpTool[] {
  const listQueuesTool: McpTool = {
    definition: {
      name: "rabbitmq_list_queues",
      description:
        "List all RabbitMQ queues. Optionally filter by virtual host.",
      inputSchema: {
        type: "object",
        properties: {
          vhost: {
            type: "string",
            description:
              "Virtual host to filter by (default: all vhosts)",
          },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.listQueues({
            vhost: args.vhost as string | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const getQueueTool: McpTool = {
    definition: {
      name: "rabbitmq_get_queue",
      description:
        "Get details for a specific RabbitMQ queue.",
      inputSchema: {
        type: "object",
        properties: {
          vhost: {
            type: "string",
            description: "Virtual host (default: /)",
          },
          name: {
            type: "string",
            description: "Queue name",
          },
        },
        required: ["name"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.getQueue({
            vhost: args.vhost as string | undefined,
            name: args.name as string,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const createQueueTool: McpTool = {
    definition: {
      name: "rabbitmq_create_queue",
      description: "Declare (create) a RabbitMQ queue.",
      inputSchema: {
        type: "object",
        properties: {
          vhost: {
            type: "string",
            description: "Virtual host (default: /)",
          },
          name: {
            type: "string",
            description: "Queue name",
          },
          durable: {
            type: "boolean",
            description: "Whether the queue survives broker restarts (default: true)",
          },
          auto_delete: {
            type: "boolean",
            description:
              "Whether the queue is deleted when last consumer disconnects (default: false)",
          },
          arguments: {
            type: "object",
            description: "Additional queue arguments",
          },
        },
        required: ["name"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.createQueue({
            vhost: args.vhost as string | undefined,
            name: args.name as string,
            durable: args.durable as boolean | undefined,
            auto_delete: args.auto_delete as boolean | undefined,
            arguments: args.arguments as Record<string, unknown> | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const deleteQueueTool: McpTool = {
    definition: {
      name: "rabbitmq_delete_queue",
      description: "Delete a RabbitMQ queue.",
      inputSchema: {
        type: "object",
        properties: {
          vhost: {
            type: "string",
            description: "Virtual host (default: /)",
          },
          name: {
            type: "string",
            description: "Queue name",
          },
        },
        required: ["name"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.deleteQueue({
            vhost: args.vhost as string | undefined,
            name: args.name as string,
          }),
        () => "Queue deleted successfully",
      ),
  };

  const listExchangesTool: McpTool = {
    definition: {
      name: "rabbitmq_list_exchanges",
      description:
        "List all RabbitMQ exchanges. Optionally filter by virtual host.",
      inputSchema: {
        type: "object",
        properties: {
          vhost: {
            type: "string",
            description:
              "Virtual host to filter by (default: all vhosts)",
          },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.listExchanges({
            vhost: args.vhost as string | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const createExchangeTool: McpTool = {
    definition: {
      name: "rabbitmq_create_exchange",
      description: "Declare (create) a RabbitMQ exchange.",
      inputSchema: {
        type: "object",
        properties: {
          vhost: {
            type: "string",
            description: "Virtual host (default: /)",
          },
          name: {
            type: "string",
            description: "Exchange name",
          },
          type: {
            type: "string",
            description:
              "Exchange type: direct, fanout, topic, headers (default: direct)",
          },
          durable: {
            type: "boolean",
            description: "Whether the exchange survives broker restarts (default: true)",
          },
          auto_delete: {
            type: "boolean",
            description:
              "Whether the exchange is deleted when last binding is removed (default: false)",
          },
          arguments: {
            type: "object",
            description: "Additional exchange arguments",
          },
        },
        required: ["name"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.createExchange({
            vhost: args.vhost as string | undefined,
            name: args.name as string,
            type: args.type as string | undefined,
            durable: args.durable as boolean | undefined,
            auto_delete: args.auto_delete as boolean | undefined,
            arguments: args.arguments as Record<string, unknown> | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const publishMessageTool: McpTool = {
    definition: {
      name: "rabbitmq_publish_message",
      description:
        "Publish a message to a RabbitMQ exchange.",
      inputSchema: {
        type: "object",
        properties: {
          vhost: {
            type: "string",
            description: "Virtual host (default: /)",
          },
          exchange: {
            type: "string",
            description: "Exchange name to publish to",
          },
          routing_key: {
            type: "string",
            description: "Routing key for the message",
          },
          properties: {
            type: "object",
            description: "Message properties (e.g. content_type, headers)",
          },
          payload: {
            type: "string",
            description: "Message payload (string body)",
          },
          payload_encoding: {
            type: "string",
            description:
              "Payload encoding: string or base64 (default: string)",
          },
        },
        required: ["exchange", "payload"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.publishMessage({
            vhost: args.vhost as string | undefined,
            exchange: args.exchange as string,
            routing_key: args.routing_key as string | undefined,
            properties: args.properties as Record<string, unknown> | undefined,
            payload: args.payload as string,
            payload_encoding: args.payload_encoding as string | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const listConnectionsTool: McpTool = {
    definition: {
      name: "rabbitmq_list_connections",
      description: "List all RabbitMQ client connections.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () =>
      safeRun(
        async () => client.listConnections(),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  return [
    listQueuesTool,
    getQueueTool,
    createQueueTool,
    deleteQueueTool,
    listExchangesTool,
    createExchangeTool,
    publishMessageTool,
    listConnectionsTool,
  ];
}
