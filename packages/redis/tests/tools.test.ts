import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRedisTools, type RedisClient } from "../src/tools/index.js";

// Mock Redis client
function createMockRedis(): RedisClient {
  return {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
    hget: vi.fn(),
    hset: vi.fn(),
    hgetall: vi.fn(),
    hdel: vi.fn(),
    publish: vi.fn(),
    info: vi.fn(),
    ttl: vi.fn(),
    expire: vi.fn(),
    type: vi.fn(),
    llen: vi.fn(),
    lrange: vi.fn(),
    scard: vi.fn(),
    smembers: vi.fn(),
    zcard: vi.fn(),
    zrange: vi.fn(),
    ping: vi.fn(),
    quit: vi.fn(),
  };
}

describe("Redis MCP Tools", () => {
  let mockRedis: ReturnType<typeof createMockRedis>;
  let tools: ReturnType<typeof createRedisTools>;

  beforeEach(() => {
    mockRedis = createMockRedis();
    tools = createRedisTools(mockRedis, "");
  });

  describe("tool definitions", () => {
    it("defines all expected tools", () => {
      const names = tools.map((t) => t.definition.name).sort();
      expect(names).toEqual([
        "del",
        "get",
        "hdel",
        "hget",
        "hgetall",
        "hset",
        "info",
        "keys",
        "ping",
        "publish",
        "set",
      ]);
    });

    it("each tool has required fields", () => {
      for (const tool of tools) {
        expect(tool.definition.name).toBeTruthy();
        expect(tool.definition.description).toBeTruthy();
        expect(tool.definition.inputSchema).toBeDefined();
        expect(typeof tool.handler).toBe("function");
      }
    });
  });

  describe("get", () => {
    it("returns the value for an existing key", async () => {
      vi.mocked(mockRedis.get).mockResolvedValue("hello");
      const getTool = tools.find((t) => t.definition.name === "get")!;
      const result = await getTool.handler({ key: "mykey" });
      expect(mockRedis.get).toHaveBeenCalledWith("mykey");
      expect(result.content[0].text).toBe("hello");
    });

    it("returns null message for missing key", async () => {
      vi.mocked(mockRedis.get).mockResolvedValue(null);
      const getTool = tools.find((t) => t.definition.name === "get")!;
      const result = await getTool.handler({ key: "missing" });
      expect(result.content[0].text).toBe("(nil)");
    });
  });

  describe("set", () => {
    it("sets a key-value pair", async () => {
      vi.mocked(mockRedis.set).mockResolvedValue("OK");
      const setTool = tools.find((t) => t.definition.name === "set")!;
      const result = await setTool.handler({ key: "mykey", value: "myval" });
      expect(mockRedis.set).toHaveBeenCalledWith("mykey", "myval");
      expect(result.content[0].text).toBe("OK");
    });

    it("sets a key with TTL", async () => {
      vi.mocked(mockRedis.set).mockResolvedValue("OK");
      const setTool = tools.find((t) => t.definition.name === "set")!;
      await setTool.handler({ key: "mykey", value: "myval", ttl: 60 });
      expect(mockRedis.set).toHaveBeenCalledWith("mykey", "myval", "EX", 60);
    });
  });

  describe("del", () => {
    it("deletes a key", async () => {
      vi.mocked(mockRedis.del).mockResolvedValue(1);
      const delTool = tools.find((t) => t.definition.name === "del")!;
      const result = await delTool.handler({ key: "mykey" });
      expect(mockRedis.del).toHaveBeenCalledWith("mykey");
      expect(result.content[0].text).toBe("1");
    });

    it("returns 0 for non-existent key", async () => {
      vi.mocked(mockRedis.del).mockResolvedValue(0);
      const delTool = tools.find((t) => t.definition.name === "del")!;
      const result = await delTool.handler({ key: "missing" });
      expect(result.content[0].text).toBe("0");
    });
  });

  describe("keys", () => {
    it("lists keys matching pattern", async () => {
      vi.mocked(mockRedis.keys).mockResolvedValue(["user:1", "user:2"]);
      const keysTool = tools.find((t) => t.definition.name === "keys")!;
      const result = await keysTool.handler({ pattern: "user:*" });
      expect(mockRedis.keys).toHaveBeenCalledWith("user:*");
      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed).toEqual(["user:1", "user:2"]);
    });

    it("defaults to * pattern", async () => {
      vi.mocked(mockRedis.keys).mockResolvedValue(["a", "b"]);
      const keysTool = tools.find((t) => t.definition.name === "keys")!;
      await keysTool.handler({ pattern: "*" });
      expect(mockRedis.keys).toHaveBeenCalledWith("*");
    });
  });

  describe("hget", () => {
    it("gets a hash field value", async () => {
      vi.mocked(mockRedis.hget).mockResolvedValue("bar");
      const hgetTool = tools.find((t) => t.definition.name === "hget")!;
      const result = await hgetTool.handler({
        key: "myhash",
        field: "foo",
      });
      expect(mockRedis.hget).toHaveBeenCalledWith("myhash", "foo");
      expect(result.content[0].text).toBe("bar");
    });

    it("returns null for missing field", async () => {
      vi.mocked(mockRedis.hget).mockResolvedValue(null);
      const hgetTool = tools.find((t) => t.definition.name === "hget")!;
      const result = await hgetTool.handler({
        key: "myhash",
        field: "missing",
      });
      expect(result.content[0].text).toBe("(nil)");
    });
  });

  describe("hset", () => {
    it("sets a hash field", async () => {
      vi.mocked(mockRedis.hset).mockResolvedValue(1);
      const hsetTool = tools.find((t) => t.definition.name === "hset")!;
      const result = await hsetTool.handler({
        key: "myhash",
        field: "foo",
        value: "bar",
      });
      expect(mockRedis.hset).toHaveBeenCalledWith("myhash", "foo", "bar");
      expect(result.content[0].text).toBe("1");
    });
  });

  describe("hgetall", () => {
    it("returns all hash fields", async () => {
      vi.mocked(mockRedis.hgetall).mockResolvedValue({ a: "1", b: "2" });
      const hgetallTool = tools.find(
        (t) => t.definition.name === "hgetall",
      )!;
      const result = await hgetallTool.handler({ key: "myhash" });
      expect(mockRedis.hgetall).toHaveBeenCalledWith("myhash");
      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed).toEqual({ a: "1", b: "2" });
    });
  });

  describe("hdel", () => {
    it("deletes hash fields", async () => {
      vi.mocked(mockRedis.hdel).mockResolvedValue(2);
      const hdelTool = tools.find((t) => t.definition.name === "hdel")!;
      const result = await hdelTool.handler({
        key: "myhash",
        fields: ["a", "b"],
      });
      expect(mockRedis.hdel).toHaveBeenCalledWith("myhash", "a", "b");
      expect(result.content[0].text).toBe("2");
    });
  });

  describe("publish", () => {
    it("publishes a message to a channel", async () => {
      vi.mocked(mockRedis.publish).mockResolvedValue(3);
      const publishTool = tools.find(
        (t) => t.definition.name === "publish",
      )!;
      const result = await publishTool.handler({
        channel: "events",
        message: "hello",
      });
      expect(mockRedis.publish).toHaveBeenCalledWith("events", "hello");
      expect(result.content[0].text).toBe("3");
    });
  });

  describe("info", () => {
    it("returns server info", async () => {
      vi.mocked(mockRedis.info).mockResolvedValue(
        "redis_version:7.0.0\nconnected_clients:5",
      );
      const infoTool = tools.find((t) => t.definition.name === "info")!;
      const result = await infoTool.handler({});
      expect(mockRedis.info).toHaveBeenCalled();
      expect(result.content[0].text).toContain("redis_version:7.0.0");
    });
  });

  describe("ping", () => {
    it("returns PONG", async () => {
      vi.mocked(mockRedis.ping).mockResolvedValue("PONG");
      const pingTool = tools.find((t) => t.definition.name === "ping")!;
      const result = await pingTool.handler({});
      expect(result.content[0].text).toBe("PONG");
    });
  });

  describe("error handling", () => {
    it("wraps Redis errors gracefully", async () => {
      vi.mocked(mockRedis.get).mockRejectedValue(
        new Error("Connection refused"),
      );
      const getTool = tools.find((t) => t.definition.name === "get")!;
      const result = await getTool.handler({ key: "mykey" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Connection refused");
    });
  });

  describe("key prefix", () => {
    it("prepends prefix to key operations", async () => {
      vi.mocked(mockRedis.get).mockResolvedValue("value");
      const prefixedTools = createRedisTools(mockRedis, "app:prod:");
      const getTool = prefixedTools.find((t) => t.definition.name === "get")!;
      await getTool.handler({ key: "mykey" });
      expect(mockRedis.get).toHaveBeenCalledWith("app:prod:mykey");
    });

    it("prepends prefix to set", async () => {
      vi.mocked(mockRedis.set).mockResolvedValue("OK");
      const prefixedTools = createRedisTools(mockRedis, "app:prod:");
      const setTool = prefixedTools.find((t) => t.definition.name === "set")!;
      await setTool.handler({ key: "mykey", value: "myval" });
      expect(mockRedis.set).toHaveBeenCalledWith(
        "app:prod:mykey",
        "myval",
      );
    });

    it("prepends prefix to del", async () => {
      vi.mocked(mockRedis.del).mockResolvedValue(1);
      const prefixedTools = createRedisTools(mockRedis, "app:prod:");
      const delTool = prefixedTools.find((t) => t.definition.name === "del")!;
      await delTool.handler({ key: "mykey" });
      expect(mockRedis.del).toHaveBeenCalledWith("app:prod:mykey");
    });

    it("prepends prefix to hash operations", async () => {
      vi.mocked(mockRedis.hget).mockResolvedValue("val");
      const prefixedTools = createRedisTools(mockRedis, "app:");
      const hgetTool = prefixedTools.find(
        (t) => t.definition.name === "hget",
      )!;
      await hgetTool.handler({ key: "myhash", field: "f" });
      expect(mockRedis.hget).toHaveBeenCalledWith("app:myhash", "f");
    });
  });
});
