import type { NatsClient } from "./types.js";
import type { McpTool, ToolResult } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createNatsTools(client: NatsClient): McpTool[] {
  function natsSafeRun<T>(fn: () => Promise<T>, format?: (r: T) => string): Promise<ToolResult> {
    return safeRun(fn, format);
  }

  const publishTool: McpTool = {
    definition: {
      name: "publish",
      description: "Publish a message to a NATS subject.",
      inputSchema: {
        type: "object",
        properties: {
          subject: { type: "string", description: "NATS subject to publish to" },
          data: { type: "string", description: "Message payload (string)" },
        },
        required: ["subject", "data"],
      },
    },
    handler: async (args) => {
      const subject = args.subject as string;
      const data = new TextEncoder().encode(args.data as string);
      return natsSafeRun(async () => {
        await client.publish(subject, data);
        return `Published to ${subject}`;
      });
    },
  };

  const subscribeTool: McpTool = {
    definition: {
      name: "subscribe",
      description: "Subscribe to a NATS subject and collect messages. Returns up to maxMessages messages (default 1) with a timeout.",
      inputSchema: {
        type: "object",
        properties: {
          subject: { type: "string", description: "NATS subject to subscribe to" },
          maxMessages: { type: "number", description: "Max messages to collect (default: 1)" },
          timeoutMs: { type: "number", description: "Timeout in milliseconds (default: 5000)" },
        },
        required: ["subject"],
      },
    },
    handler: async (args) => {
      const subject = args.subject as string;
      const maxMessages = (args.maxMessages as number) ?? 1;
      const timeoutMs = (args.timeoutMs as number) ?? 5000;

      return natsSafeRun(async () => {
        const sub = client.subscribe(subject);
        const messages: Array<{ subject: string; data: string }> = [];
        const deadline = Date.now() + timeoutMs;

        for await (const msg of sub) {
          messages.push({
            subject: msg.subject,
            data: new TextDecoder().decode(msg.data),
          });
          if (messages.length >= maxMessages) break;
          if (Date.now() >= deadline) break;
        }

        sub.unsubscribe();
        return JSON.stringify(messages, null, 2);
      });
    },
  };

  const jsPublishTool: McpTool = {
    definition: {
      name: "jetstream_publish",
      description: "Publish a message to a JetStream-enabled subject. Returns the publish acknowledgement with stream name and sequence number.",
      inputSchema: {
        type: "object",
        properties: {
          subject: { type: "string", description: "JetStream subject" },
          data: { type: "string", description: "Message payload" },
        },
        required: ["subject", "data"],
      },
    },
    handler: async (args) => {
      const subject = args.subject as string;
      const data = new TextEncoder().encode(args.data as string);
      return natsSafeRun(
        async () => {
          const js = client.jetstream();
          const ack = await js.publish(subject, data);
          return JSON.stringify(ack, null, 2);
        },
      );
    },
  };

  const jsCreateStreamTool: McpTool = {
    definition: {
      name: "jetstream_create_stream",
      description: "Create a JetStream stream with specified subjects and retention policy.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Stream name" },
          subjects: { type: "array", items: { type: "string" }, description: "Subjects to capture" },
          retention: { type: "string", description: "Retention policy: limits, interest, workqueue (default: limits)" },
          maxMessages: { type: "number", description: "Max messages in stream (default: unlimited)" },
          storage: { type: "string", description: "Storage backend: file or memory (default: file)" },
        },
        required: ["name", "subjects"],
      },
    },
    handler: async (args) => {
      return natsSafeRun(
        async () => {
          const js = client.jetstream();
          const info = await js.streams.add({
            name: args.name as string,
            subjects: args.subjects as string[],
            retention: (args.retention as string ?? "limits") as "limits" | "interest" | "workqueue",
            max_msgs: (args.maxMessages as number) ?? -1,
            storage: (args.storage as string ?? "file") as "file" | "memory",
          });
          return JSON.stringify(info, null, 2);
        },
      );
    },
  };

  const jsListStreamsTool: McpTool = {
    definition: {
      name: "jetstream_list_streams",
      description: "List all JetStream streams with their configuration and state.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () => {
      return natsSafeRun(
        async () => {
          const js = client.jetstream();
          const streams = await js.streams.list();
          return JSON.stringify(streams, null, 2);
        },
      );
    },
  };

  const jsGetMessageTool: McpTool = {
    definition: {
      name: "jetstream_get_message",
      description: "Get a specific message from a JetStream stream by sequence number.",
      inputSchema: {
        type: "object",
        properties: {
          stream: { type: "string", description: "Stream name" },
          seq: { type: "number", description: "Message sequence number" },
        },
        required: ["stream", "seq"],
      },
    },
    handler: async (args) => {
      return natsSafeRun(
        async () => {
          const js = client.jetstream();
          const msg = await js.streams.message(args.stream as string, args.seq as number);
          return JSON.stringify({
            subject: msg.subject,
            seq: msg.seq,
            time: msg.time,
            data: new TextDecoder().decode(msg.data),
          }, null, 2);
        },
      );
    },
  };

  const jsDeleteStreamTool: McpTool = {
    definition: {
      name: "jetstream_delete_stream",
      description: "Delete a JetStream stream and all its messages.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Stream name to delete" },
        },
        required: ["name"],
      },
    },
    handler: async (args) => {
      return natsSafeRun(async () => {
        const js = client.jetstream();
        const deleted = await js.streams.delete(args.name as string);
        return deleted ? `Stream '${args.name}' deleted` : `Stream '${args.name}' not found`;
      });
    },
  };

  return [
    publishTool,
    subscribeTool,
    jsPublishTool,
    jsCreateStreamTool,
    jsListStreamsTool,
    jsGetMessageTool,
    jsDeleteStreamTool,
  ];
}
