import type { KafkaClient } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createKafkaTools(kafka: KafkaClient): McpTool[] {
  const listTopicsTool: McpTool = {
    definition: {
      name: "list_topics",
      description: "List all Kafka topics with partition and replication info.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () => {
      return safeRun(
        async () => {
          const topics = await kafka.listTopics();
          return topics.map((t) => ({
            name: t.name,
            partitions: t.partitions,
            replicationFactor: t.replicationFactor,
          }));
        },
        (rows) => JSON.stringify(rows, null, 2),
      );
    },
  };

  const createTopicTool: McpTool = {
    definition: {
      name: "create_topic",
      description: "Create a new Kafka topic.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Topic name" },
          numPartitions: { type: "number", description: "Number of partitions (default: 1)" },
          replicationFactor: { type: "number", description: "Replication factor (default: 1)" },
        },
        required: ["name"],
      },
    },
    handler: async (args) => {
      return safeRun(async () => {
        await kafka.createTopic(
          args.name as string,
          args.numPartitions as number | undefined,
          args.replicationFactor as number | undefined,
        );
        return `Topic "${args.name}" created`;
      });
    },
  };

  const deleteTopicTool: McpTool = {
    definition: {
      name: "delete_topic",
      description: "Delete a Kafka topic.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Topic name" },
        },
        required: ["name"],
      },
    },
    handler: async (args) => {
      return safeRun(async () => {
        await kafka.deleteTopic(args.name as string);
        return `Topic "${args.name}" deleted`;
      });
    },
  };

  const produceMessageTool: McpTool = {
    definition: {
      name: "produce_message",
      description: "Produce a message to a Kafka topic.",
      inputSchema: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Topic name" },
          message: { type: "string", description: "Message value" },
          key: { type: "string", description: "Message key (optional)" },
          partition: { type: "number", description: "Target partition (optional)" },
        },
        required: ["topic", "message"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          return await kafka.produceMessage(
            args.topic as string,
            args.message as string,
            args.key as string | undefined,
            args.partition as number | undefined,
          );
        },
        (result) => JSON.stringify(result, null, 2),
      );
    },
  };

  const consumeMessagesTool: McpTool = {
    definition: {
      name: "consume_messages",
      description: "Consume messages from a Kafka topic (batch read, does not commit offsets).",
      inputSchema: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Topic name" },
          groupId: { type: "string", description: "Consumer group ID" },
          maxMessages: { type: "number", description: "Max messages to read (default: 10)" },
          fromBeginning: { type: "boolean", description: "Read from beginning (default: false)" },
        },
        required: ["topic", "groupId"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          return await kafka.consumeMessages(
            args.topic as string,
            args.groupId as string,
            args.maxMessages as number | undefined,
            args.fromBeginning as boolean | undefined,
          );
        },
        (msgs) => JSON.stringify(msgs, null, 2),
      );
    },
  };

  const describeTopicTool: McpTool = {
    definition: {
      name: "describe_topic",
      description: "Get detailed info about a Kafka topic: partitions, offsets, configs.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Topic name" },
        },
        required: ["name"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          return await kafka.describeTopic(args.name as string);
        },
        (detail) => JSON.stringify(detail, null, 2),
      );
    },
  };

  const listConsumerGroupsTool: McpTool = {
    definition: {
      name: "list_consumer_groups",
      description: "List all consumer groups on the Kafka cluster.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () => {
      return safeRun(
        async () => {
          return await kafka.listConsumerGroups();
        },
        (groups) => JSON.stringify(groups, null, 2),
      );
    },
  };

  const describeConsumerGroupTool: McpTool = {
    definition: {
      name: "describe_consumer_group",
      description: "Get detailed info about a consumer group: members, assignments, offsets.",
      inputSchema: {
        type: "object",
        properties: {
          groupId: { type: "string", description: "Consumer group ID" },
        },
        required: ["groupId"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          return await kafka.describeConsumerGroup(args.groupId as string);
        },
        (detail) => JSON.stringify(detail, null, 2),
      );
    },
  };

  return [
    listTopicsTool,
    createTopicTool,
    deleteTopicTool,
    produceMessageTool,
    consumeMessagesTool,
    describeTopicTool,
    listConsumerGroupsTool,
    describeConsumerGroupTool,
  ];
}
