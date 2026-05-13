import type { KafkaClient } from "./tools/types.js";
import { createKafkaTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type KafkaConfig } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  kafka: KafkaClient;
  logger: Logger;
  config: KafkaConfig;
}

/** Create a Kafka client using dynamic import to handle ESM/CJS interop */
async function createRealKafkaClient(config: KafkaConfig): Promise<KafkaClient> {
  const { Kafka: KafkaJS } = await import("kafkajs");

  const kafkaInstance = new KafkaJS({
    clientId: config.clientId,
    brokers: config.brokers,
    ssl: config.ssl,
    sasl: config.sasl as any,
  });

  const admin = kafkaInstance.admin();
  let adminConnected = false;

  async function ensureAdmin() {
    if (!adminConnected) {
      await admin.connect();
      adminConnected = true;
    }
  }

  return {
    async listTopics() {
      await ensureAdmin();
      const metadata = await admin.fetchTopicMetadata();
      const topics = metadata.topics.filter((t) => !t.name.startsWith("__"));
      return topics.map((t) => ({
        name: t.name,
        partitions: t.partitions.length,
        replicationFactor: t.partitions[0]?.replicas.length ?? 0,
      }));
    },

    async createTopic(name: string, numPartitions?: number, replicationFactor?: number) {
      await ensureAdmin();
      await admin.createTopics({
        topics: [
          {
            topic: name,
            numPartitions: numPartitions ?? 1,
            replicationFactor: replicationFactor ?? 1,
          },
        ],
      });
    },

    async deleteTopic(name: string) {
      await ensureAdmin();
      await admin.deleteTopics({ topics: [name] });
    },

    async produceMessage(topic: string, message: string, key?: string, partition?: number) {
      const producer = kafkaInstance.producer();
      await producer.connect();
      try {
        const result = await producer.send({
          topic,
          messages: [
            {
              key: key ?? null,
              value: message,
              partition,
            },
          ],
        });
        const first = result[0];
        return {
          topic,
          partition: first.partition,
          offset: first.offset ?? first.baseOffset ?? "0",
          timestamp: first.timestamp ?? new Date().toISOString(),
        };
      } finally {
        await producer.disconnect();
      }
    },

    async consumeMessages(topic: string, groupId: string, maxMessages?: number, fromBeginning?: boolean) {
      const consumer = kafkaInstance.consumer({ groupId });
      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: fromBeginning ?? false });

      const messages: Array<{
        topic: string;
        partition: number;
        offset: string;
        key: string | null;
        value: string;
        timestamp: string;
      }> = [];

      const max = maxMessages ?? 10;

      await consumer.run({
        eachMessage: async ({ topic: t, partition, message }) => {
          if (messages.length < max) {
            messages.push({
              topic: t,
              partition,
              offset: message.offset,
              key: message.key?.toString() ?? null,
              value: message.value?.toString() ?? "",
              timestamp: message.timestamp,
            });
          }
        },
      });

      // Wait briefly to collect messages, then disconnect
      await new Promise((r) => setTimeout(r, 2000));
      await consumer.disconnect();

      return messages;
    },

    async describeTopic(name: string) {
      await ensureAdmin();
      const metadata = await admin.fetchTopicMetadata({ topics: [name] });
      const topic = metadata.topics[0];
      if (!topic) throw new Error(`Topic "${name}" not found`);

      const offsets = await admin.fetchTopicOffsets(name);
      let configs: Record<string, string> = {};
      try {
        const configRes = await admin.describeConfigs({
          includeSynonyms: false,
          resources: [{ type: 2, name }],
        });
        const topicConfig = configRes.resources[0]?.configEntries ?? [];
        configs = Object.fromEntries(topicConfig.map((c) => [c.configName, c.configValue]));
      } catch {
        // configs may not be available
      }

      return {
        name: topic.name,
        partitions: topic.partitions.map((p, i) => ({
          partition: i,
          leader: p.leader,
          replicas: p.replicas,
          isr: p.isr,
          earliestOffset: offsets[i]?.low ?? "0",
          latestOffset: offsets[i]?.high ?? "0",
        })),
        configs,
      };
    },

    async listConsumerGroups() {
      await ensureAdmin();
      const groups = await admin.listGroups();
      return groups.groups.map((g) => ({
        groupId: g.groupId,
        state: "unknown",
        protocol: g.protocolType,
      }));
    },

    async describeConsumerGroup(groupId: string) {
      await ensureAdmin();
      const desc = await admin.describeGroups([groupId]);
      const group = desc.groups[0];
      if (!group) throw new Error(`Consumer group "${groupId}" not found`);

      const offsets = await admin.fetchOffsets({ groupId });
      // Fetch high/low watermarks per topic
      const topicOffsets: Array<{
        topic: string;
        partition: number;
        offset: string;
        high: string;
        low: string;
      }> = [];
      for (const o of offsets) {
        try {
          const watermarks = await admin.fetchTopicOffsets(o.topic);
          for (const p of o.partitions) {
            const wm = watermarks.find((w) => w.partition === p.partition);
            topicOffsets.push({
              topic: o.topic,
              partition: p.partition,
              offset: p.offset,
              high: wm?.high ?? "0",
              low: wm?.low ?? "0",
            });
          }
        } catch {
          for (const p of o.partitions) {
            topicOffsets.push({
              topic: o.topic,
              partition: p.partition,
              offset: p.offset,
              high: "0",
              low: "0",
            });
          }
        }
      }

      return {
        groupId: group.groupId,
        state: group.state,
        members: group.members.map((m) => ({
          memberId: m.memberId,
          clientId: m.clientId,
          host: m.clientHost,
          assignments: {} as Record<string, number[]>,
        })),
        offsets: topicOffsets,
      };
    },
  };
}

export async function createServerContext(config?: Partial<KafkaConfig>): Promise<ServerContext> {
  const fullConfig = config?.brokers
    ? {
        brokers: config.brokers,
        clientId: config.clientId ?? "mcp-toolkit-kafka",
        sasl: config.sasl,
        ssl: config.ssl ?? false,
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({
    name: "kafka",
    level: fullConfig.logLevel,
  });

  const kafka = await createRealKafkaClient(fullConfig);
  const tools = createKafkaTools(kafka);
  const server = createMcpServer("@mcp-toolkit/kafka", "0.1.0", tools, logger);

  return { server, kafka, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "Kafka", {
    transport: ctx.config.transport,
    port: ctx.config.port,
  });
}
