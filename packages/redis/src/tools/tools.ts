import type { RedisClient } from "./types.js";
import type { McpTool, ToolResult } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

function prefixedKey(prefix: string, key: string): string {
  return prefix ? `${prefix}${key}` : key;
}

export function createRedisTools(redis: RedisClient, keyPrefix: string): McpTool[] {
  function prefix(key: string): string {
    return prefixedKey(keyPrefix, key);
  }

  function redisSafeRun<T>(fn: () => Promise<T>): Promise<ToolResult> {
    return safeRun(fn);
  }

  const getTool: McpTool = {
    definition: {
      name: "get",
      description: "Get the value of a Redis key. Returns the string value or (nil) if the key does not exist.",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "Redis key name" },
        },
        required: ["key"],
      },
    },
    handler: async (args) => {
      return redisSafeRun(async () => {
        const value = await redis.get(prefix(args.key as string));
        return value ?? "(nil)";
      });
    },
  };

  const setTool: McpTool = {
    definition: {
      name: "set",
      description: "Set a key-value pair in Redis. Optionally specify a TTL in seconds.",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "Redis key name" },
          value: { type: "string", description: "Value to store" },
          ttl: { type: "number", description: "Time-to-live in seconds (optional)" },
        },
        required: ["key", "value"],
      },
    },
    handler: async (args) => {
      const key = prefix(args.key as string);
      const value = args.value as string;
      const ttl = args.ttl as number | undefined;
      if (ttl !== undefined) {
        return redisSafeRun(() => redis.set(key, value, "EX", ttl));
      }
      return redisSafeRun(() => redis.set(key, value));
    },
  };

  const delTool: McpTool = {
    definition: {
      name: "del",
      description: "Delete a Redis key. Returns the number of keys removed (0 or 1).",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "Redis key to delete" },
        },
        required: ["key"],
      },
    },
    handler: async (args) => {
      return redisSafeRun(() => redis.del(prefix(args.key as string)));
    },
  };

  const keysTool: McpTool = {
    definition: {
      name: "keys",
      description: "List all Redis keys matching a pattern (e.g., 'user:*'). Returns a JSON array.",
      inputSchema: {
        type: "object",
        properties: {
          pattern: { type: "string", description: "Glob pattern (default: '*')" },
        },
        required: ["pattern"],
      },
    },
    handler: async (args) => {
      const pattern = prefix((args.pattern as string) || "*");
      return redisSafeRun(async () => {
        const keys = await redis.keys(pattern);
        return JSON.stringify(keys, null, 2);
      });
    },
  };

  const hgetTool: McpTool = {
    definition: {
      name: "hget",
      description: "Get a field value from a Redis hash. Returns (nil) if the field does not exist.",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "Hash key name" },
          field: { type: "string", description: "Hash field name" },
        },
        required: ["key", "field"],
      },
    },
    handler: async (args) => {
      return redisSafeRun(async () => {
        const value = await redis.hget(
          prefix(args.key as string),
          args.field as string,
        );
        return value ?? "(nil)";
      });
    },
  };

  const hsetTool: McpTool = {
    definition: {
      name: "hset",
      description: "Set a field in a Redis hash. Returns 1 if the field is new, 0 if it was updated.",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "Hash key name" },
          field: { type: "string", description: "Hash field name" },
          value: { type: "string", description: "Field value" },
        },
        required: ["key", "field", "value"],
      },
    },
    handler: async (args) => {
      return redisSafeRun(() =>
        redis.hset(
          prefix(args.key as string),
          args.field as string,
          args.value as string,
        ),
      );
    },
  };

  const hgetallTool: McpTool = {
    definition: {
      name: "hgetall",
      description: "Get all field-value pairs from a Redis hash. Returns a JSON object.",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "Hash key name" },
        },
        required: ["key"],
      },
    },
    handler: async (args) => {
      return redisSafeRun(async () => {
        const obj = await redis.hgetall(prefix(args.key as string));
        return JSON.stringify(obj, null, 2);
      });
    },
  };

  const hdelTool: McpTool = {
    definition: {
      name: "hdel",
      description: "Delete one or more fields from a Redis hash. Returns the number of fields removed.",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "Hash key name" },
          fields: {
            type: "array",
            items: { type: "string" },
            description: "Field names to delete",
          },
        },
        required: ["key", "fields"],
      },
    },
    handler: async (args) => {
      const fields = args.fields as string[];
      return redisSafeRun(() => redis.hdel(prefix(args.key as string), ...fields));
    },
  };

  const publishTool: McpTool = {
    definition: {
      name: "publish",
      description: "Publish a message to a Redis channel. Returns the number of subscribers that received the message.",
      inputSchema: {
        type: "object",
        properties: {
          channel: { type: "string", description: "Channel name" },
          message: { type: "string", description: "Message to publish" },
        },
        required: ["channel", "message"],
      },
    },
    handler: async (args) => {
      return redisSafeRun(() =>
        redis.publish(args.channel as string, args.message as string),
      );
    },
  };

  const infoTool: McpTool = {
    definition: {
      name: "info",
      description: "Get Redis server information and statistics.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () => {
      return redisSafeRun(() => redis.info());
    },
  };

  const pingTool: McpTool = {
    definition: {
      name: "ping",
      description: "Ping the Redis server. Returns PONG if the connection is alive.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () => {
      return redisSafeRun(() => redis.ping());
    },
  };

  return [
    getTool,
    setTool,
    delTool,
    keysTool,
    hgetTool,
    hsetTool,
    hgetallTool,
    hdelTool,
    publishTool,
    infoTool,
    pingTool,
  ];
}
