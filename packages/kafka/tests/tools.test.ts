import { describe, it, expect, vi } from "vitest";
import { createKafkaTools } from "../src/tools/index.js";
import type { KafkaClient } from "../src/tools/types.js";

function mockKafkaClient(overrides: Partial<KafkaClient> = {}): KafkaClient {
  return {
    listTopics: vi.fn().mockResolvedValue([
      { name: "orders", partitions: 3, replicationFactor: 2 },
      { name: "events", partitions: 6, replicationFactor: 3 },
    ]),
    createTopic: vi.fn().mockResolvedValue(undefined),
    deleteTopic: vi.fn().mockResolvedValue(undefined),
    produceMessage: vi.fn().mockResolvedValue({
      topic: "orders",
      partition: 0,
      offset: "42",
      timestamp: "2024-01-01T00:00:00Z",
    }),
    consumeMessages: vi.fn().mockResolvedValue([
      { topic: "orders", partition: 0, offset: "40", key: "order-1", value: '{"amount":100}', timestamp: "1700000000000" },
      { topic: "orders", partition: 1, offset: "15", key: "order-2", value: '{"amount":200}', timestamp: "1700000001000" },
    ]),
    describeTopic: vi.fn().mockResolvedValue({
      name: "orders",
      partitions: [
        { partition: 0, leader: 1, replicas: [1, 2], isr: [1, 2], earliestOffset: "0", latestOffset: "42" },
        { partition: 1, leader: 2, replicas: [2, 1], isr: [2, 1], earliestOffset: "0", latestOffset: "38" },
        { partition: 2, leader: 1, replicas: [1, 2], isr: [1], earliestOffset: "0", latestOffset: "55" },
      ],
      configs: { "cleanup.policy": "delete", "retention.ms": "604800000" },
    }),
    listConsumerGroups: vi.fn().mockResolvedValue([
      { groupId: "order-processor", state: "Stable", protocol: "range" },
      { groupId: "analytics", state: "Stable", protocol: "roundrobin" },
    ]),
    describeConsumerGroup: vi.fn().mockResolvedValue({
      groupId: "order-processor",
      state: "Stable",
      members: [
        {
          memberId: "consumer-1-abc",
          clientId: "consumer-1",
          host: "10.0.0.1:9092",
          assignments: { orders: [0, 1] },
        },
      ],
      offsets: [
        { topic: "orders", partition: 0, offset: "40", high: "42", low: "0" },
        { topic: "orders", partition: 1, offset: "38", high: "38", low: "0" },
      ],
    }),
    ...overrides,
  };
}

describe("Kafka tools", () => {
  it("should have 8 tools", () => {
    const tools = createKafkaTools(mockKafkaClient());
    expect(tools).toHaveLength(8);
  });

  describe("list_topics", () => {
    it("should list all topics", async () => {
      const client = mockKafkaClient();
      const tools = createKafkaTools(client);
      const tool = tools.find((t) => t.definition.name === "list_topics")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("orders");
      expect(result.content[0].text).toContain("events");
    });

    it("should show partition counts", async () => {
      const client = mockKafkaClient();
      const tools = createKafkaTools(client);
      const tool = tools.find((t) => t.definition.name === "list_topics")!;

      const result = await tool.handler({});
      expect(result.content[0].text).toContain("3");
      expect(result.content[0].text).toContain("6");
    });
  });

  describe("create_topic", () => {
    it("should create topic with defaults", async () => {
      const client = mockKafkaClient();
      const tools = createKafkaTools(client);
      const tool = tools.find((t) => t.definition.name === "create_topic")!;

      const result = await tool.handler({ name: "new-topic" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("created");
      expect(client.createTopic).toHaveBeenCalledWith("new-topic", undefined, undefined);
    });

    it("should create topic with custom partitions", async () => {
      const client = mockKafkaClient();
      const tools = createKafkaTools(client);
      const tool = tools.find((t) => t.definition.name === "create_topic")!;

      await tool.handler({ name: "high-throughput", numPartitions: 12, replicationFactor: 3 });
      expect(client.createTopic).toHaveBeenCalledWith("high-throughput", 12, 3);
    });
  });

  describe("delete_topic", () => {
    it("should delete a topic", async () => {
      const client = mockKafkaClient();
      const tools = createKafkaTools(client);
      const tool = tools.find((t) => t.definition.name === "delete_topic")!;

      const result = await tool.handler({ name: "old-topic" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("deleted");
      expect(client.deleteTopic).toHaveBeenCalledWith("old-topic");
    });
  });

  describe("produce_message", () => {
    it("should produce a message", async () => {
      const client = mockKafkaClient();
      const tools = createKafkaTools(client);
      const tool = tools.find((t) => t.definition.name === "produce_message")!;

      const result = await tool.handler({ topic: "orders", message: '{"orderId":1}' });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("orders");
      expect(result.content[0].text).toContain("42");
      expect(client.produceMessage).toHaveBeenCalledWith("orders", '{"orderId":1}', undefined, undefined);
    });

    it("should produce with key and partition", async () => {
      const client = mockKafkaClient();
      const tools = createKafkaTools(client);
      const tool = tools.find((t) => t.definition.name === "produce_message")!;

      await tool.handler({ topic: "orders", message: "data", key: "order-1", partition: 2 });
      expect(client.produceMessage).toHaveBeenCalledWith("orders", "data", "order-1", 2);
    });
  });

  describe("consume_messages", () => {
    it("should consume messages", async () => {
      const client = mockKafkaClient();
      const tools = createKafkaTools(client);
      const tool = tools.find((t) => t.definition.name === "consume_messages")!;

      const result = await tool.handler({ topic: "orders", groupId: "my-group" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("order-1");
      expect(result.content[0].text).toContain("order-2");
      expect(client.consumeMessages).toHaveBeenCalledWith("orders", "my-group", undefined, undefined);
    });

    it("should pass maxMessages and fromBeginning", async () => {
      const client = mockKafkaClient();
      const tools = createKafkaTools(client);
      const tool = tools.find((t) => t.definition.name === "consume_messages")!;

      await tool.handler({ topic: "orders", groupId: "my-group", maxMessages: 5, fromBeginning: true });
      expect(client.consumeMessages).toHaveBeenCalledWith("orders", "my-group", 5, true);
    });
  });

  describe("describe_topic", () => {
    it("should describe topic details", async () => {
      const client = mockKafkaClient();
      const tools = createKafkaTools(client);
      const tool = tools.find((t) => t.definition.name === "describe_topic")!;

      const result = await tool.handler({ name: "orders" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("orders");
      expect(result.content[0].text).toContain("cleanup.policy");
      expect(result.content[0].text).toContain("604800000");
    });

    it("should show partition info", async () => {
      const client = mockKafkaClient();
      const tools = createKafkaTools(client);
      const tool = tools.find((t) => t.definition.name === "describe_topic")!;

      const result = await tool.handler({ name: "orders" });
      expect(result.content[0].text).toContain("42");
      expect(result.content[0].text).toContain("leader");
    });
  });

  describe("list_consumer_groups", () => {
    it("should list consumer groups", async () => {
      const client = mockKafkaClient();
      const tools = createKafkaTools(client);
      const tool = tools.find((t) => t.definition.name === "list_consumer_groups")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("order-processor");
      expect(result.content[0].text).toContain("analytics");
      expect(result.content[0].text).toContain("Stable");
    });
  });

  describe("describe_consumer_group", () => {
    it("should describe consumer group details", async () => {
      const client = mockKafkaClient();
      const tools = createKafkaTools(client);
      const tool = tools.find((t) => t.definition.name === "describe_consumer_group")!;

      const result = await tool.handler({ groupId: "order-processor" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("order-processor");
      expect(result.content[0].text).toContain("consumer-1");
      expect(result.content[0].text).toContain("10.0.0.1");
    });

    it("should show lag info in offsets", async () => {
      const client = mockKafkaClient();
      const tools = createKafkaTools(client);
      const tool = tools.find((t) => t.definition.name === "describe_consumer_group")!;

      const result = await tool.handler({ groupId: "order-processor" });
      expect(result.content[0].text).toContain("high");
      expect(result.content[0].text).toContain("low");
    });
  });

  describe("error handling", () => {
    it("should return error on topic list failure", async () => {
      const client = mockKafkaClient({
        listTopics: vi.fn().mockRejectedValue(new Error("Broker not available")),
      });
      const tools = createKafkaTools(client);
      const tool = tools.find((t) => t.definition.name === "list_topics")!;

      const result = await tool.handler({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Broker not available");
    });

    it("should return error on produce failure", async () => {
      const client = mockKafkaClient({
        produceMessage: vi.fn().mockRejectedValue(new Error("Topic not found")),
      });
      const tools = createKafkaTools(client);
      const tool = tools.find((t) => t.definition.name === "produce_message")!;

      const result = await tool.handler({ topic: "missing", message: "data" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Topic not found");
    });

    it("should return error on describe non-existent topic", async () => {
      const client = mockKafkaClient({
        describeTopic: vi.fn().mockRejectedValue(new Error('Topic "nope" not found')),
      });
      const tools = createKafkaTools(client);
      const tool = tools.find((t) => t.definition.name === "describe_topic")!;

      const result = await tool.handler({ name: "nope" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("not found");
    });
  });
});
