import { describe, it, expect, vi } from "vitest";
import { createRabbitMQTools } from "../src/tools/index.js";
import type { RabbitMQClient } from "../src/tools/types.js";

function mockRabbitMQClient(
  overrides: Partial<RabbitMQClient> = {},
): RabbitMQClient {
  return {
    listQueues: vi.fn().mockResolvedValue([
      {
        name: "orders",
        vhost: "/",
        durable: true,
        auto_delete: false,
        state: "running",
        messages: 42,
        messages_ready: 40,
        messages_unacknowledged: 2,
        consumers: 1,
      },
      {
        name: "notifications",
        vhost: "/",
        durable: true,
        auto_delete: false,
        state: "running",
        messages: 10,
        messages_ready: 10,
        messages_unacknowledged: 0,
        consumers: 0,
      },
    ]),
    getQueue: vi.fn().mockResolvedValue({
      name: "orders",
      vhost: "/",
      durable: true,
      auto_delete: false,
      state: "running",
      messages: 42,
      messages_ready: 40,
      messages_unacknowledged: 2,
      consumers: 1,
    }),
    createQueue: vi.fn().mockResolvedValue({
      name: "new_queue",
      vhost: "/",
      durable: true,
      auto_delete: false,
    }),
    deleteQueue: vi.fn().mockResolvedValue(undefined),
    listExchanges: vi.fn().mockResolvedValue([
      {
        name: "amq.direct",
        vhost: "/",
        type: "direct",
        durable: true,
        auto_delete: false,
      },
      {
        name: "events",
        vhost: "/",
        type: "fanout",
        durable: false,
        auto_delete: false,
      },
    ]),
    createExchange: vi.fn().mockResolvedValue({
      name: "new_exchange",
      vhost: "/",
      type: "topic",
      durable: true,
      auto_delete: false,
    }),
    publishMessage: vi.fn().mockResolvedValue({ routed: true }),
    listConnections: vi.fn().mockResolvedValue([
      {
        name: "127.0.0.1:5678 -> 127.0.0.1:5672",
        state: "running",
        channels: 2,
        user: "guest",
        peer_host: "127.0.0.1",
        peer_port: 5678,
      },
    ]),
    ...overrides,
  };
}

describe("RabbitMQ tools", () => {
  it("should have 8 tools", () => {
    const tools = createRabbitMQTools(mockRabbitMQClient());
    expect(tools).toHaveLength(8);
  });

  describe("rabbitmq_list_queues", () => {
    it("should list queues", async () => {
      const client = mockRabbitMQClient();
      const tools = createRabbitMQTools(client);
      const tool = tools.find(
        (t) => t.definition.name === "rabbitmq_list_queues",
      )!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("orders");
      expect(result.content[0].text).toContain("notifications");
      expect(client.listQueues).toHaveBeenCalled();
    });

    it("should filter by vhost", async () => {
      const client = mockRabbitMQClient();
      const tools = createRabbitMQTools(client);
      const tool = tools.find(
        (t) => t.definition.name === "rabbitmq_list_queues",
      )!;

      await tool.handler({ vhost: "production" });
      expect(client.listQueues).toHaveBeenCalledWith({ vhost: "production" });
    });
  });

  describe("rabbitmq_get_queue", () => {
    it("should get a queue by name", async () => {
      const client = mockRabbitMQClient();
      const tools = createRabbitMQTools(client);
      const tool = tools.find(
        (t) => t.definition.name === "rabbitmq_get_queue",
      )!;

      const result = await tool.handler({ name: "orders" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("orders");
      expect(result.content[0].text).toContain("42");
      expect(client.getQueue).toHaveBeenCalledWith({
        vhost: undefined,
        name: "orders",
      });
    });
  });

  describe("rabbitmq_create_queue", () => {
    it("should create a queue", async () => {
      const client = mockRabbitMQClient();
      const tools = createRabbitMQTools(client);
      const tool = tools.find(
        (t) => t.definition.name === "rabbitmq_create_queue",
      )!;

      const result = await tool.handler({
        name: "new_queue",
        durable: true,
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("new_queue");
      expect(client.createQueue).toHaveBeenCalledWith({
        vhost: undefined,
        name: "new_queue",
        durable: true,
        auto_delete: undefined,
        arguments: undefined,
      });
    });
  });

  describe("rabbitmq_delete_queue", () => {
    it("should delete a queue", async () => {
      const client = mockRabbitMQClient();
      const tools = createRabbitMQTools(client);
      const tool = tools.find(
        (t) => t.definition.name === "rabbitmq_delete_queue",
      )!;

      const result = await tool.handler({ name: "old_queue" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("deleted");
      expect(client.deleteQueue).toHaveBeenCalledWith({
        vhost: undefined,
        name: "old_queue",
      });
    });
  });

  describe("rabbitmq_list_exchanges", () => {
    it("should list exchanges", async () => {
      const client = mockRabbitMQClient();
      const tools = createRabbitMQTools(client);
      const tool = tools.find(
        (t) => t.definition.name === "rabbitmq_list_exchanges",
      )!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("amq.direct");
      expect(result.content[0].text).toContain("events");
      expect(client.listExchanges).toHaveBeenCalled();
    });
  });

  describe("rabbitmq_create_exchange", () => {
    it("should create an exchange", async () => {
      const client = mockRabbitMQClient();
      const tools = createRabbitMQTools(client);
      const tool = tools.find(
        (t) => t.definition.name === "rabbitmq_create_exchange",
      )!;

      const result = await tool.handler({
        name: "new_exchange",
        type: "topic",
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("new_exchange");
      expect(result.content[0].text).toContain("topic");
      expect(client.createExchange).toHaveBeenCalledWith({
        vhost: undefined,
        name: "new_exchange",
        type: "topic",
        durable: undefined,
        auto_delete: undefined,
        arguments: undefined,
      });
    });
  });

  describe("rabbitmq_publish_message", () => {
    it("should publish a message", async () => {
      const client = mockRabbitMQClient();
      const tools = createRabbitMQTools(client);
      const tool = tools.find(
        (t) => t.definition.name === "rabbitmq_publish_message",
      )!;

      const result = await tool.handler({
        exchange: "events",
        routing_key: "order.created",
        payload: '{"orderId": 123}',
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("routed");
      expect(client.publishMessage).toHaveBeenCalledWith({
        vhost: undefined,
        exchange: "events",
        routing_key: "order.created",
        properties: undefined,
        payload: '{"orderId": 123}',
        payload_encoding: undefined,
      });
    });
  });

  describe("rabbitmq_list_connections", () => {
    it("should list connections", async () => {
      const client = mockRabbitMQClient();
      const tools = createRabbitMQTools(client);
      const tool = tools.find(
        (t) => t.definition.name === "rabbitmq_list_connections",
      )!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("127.0.0.1");
      expect(result.content[0].text).toContain("guest");
      expect(client.listConnections).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should return error on API failure", async () => {
      const client = mockRabbitMQClient({
        listQueues: vi
          .fn()
          .mockRejectedValue(new Error("Connection refused")),
      });
      const tools = createRabbitMQTools(client);
      const tool = tools.find(
        (t) => t.definition.name === "rabbitmq_list_queues",
      )!;

      const result = await tool.handler({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Connection refused");
    });

    it("should return error on queue not found", async () => {
      const client = mockRabbitMQClient({
        getQueue: vi
          .fn()
          .mockRejectedValue(new Error("RabbitMQ API error (404): Not Found")),
      });
      const tools = createRabbitMQTools(client);
      const tool = tools.find(
        (t) => t.definition.name === "rabbitmq_get_queue",
      )!;

      const result = await tool.handler({ name: "nonexistent" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("404");
    });

    it("should return error on publish failure", async () => {
      const client = mockRabbitMQClient({
        publishMessage: vi
          .fn()
          .mockRejectedValue(
            new Error("RabbitMQ API error (404): Exchange not found"),
          ),
      });
      const tools = createRabbitMQTools(client);
      const tool = tools.find(
        (t) => t.definition.name === "rabbitmq_publish_message",
      )!;

      const result = await tool.handler({
        exchange: "nonexistent",
        payload: "test",
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Exchange not found");
    });
  });
});
