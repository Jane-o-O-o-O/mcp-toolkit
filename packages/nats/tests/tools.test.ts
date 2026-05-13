import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNatsTools, type NatsClient } from "../src/tools/index.js";

function createMockNats(): NatsClient {
  const mockSub = {
    [Symbol.asyncIterator]: vi.fn(() => ({
      next: vi.fn().mockResolvedValue({ done: true, value: undefined }),
      [Symbol.asyncIterator]() { return this; },
    })),
    unsubscribe: vi.fn(),
    drain: vi.fn().mockResolvedValue(undefined),
  };

  return {
    publish: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockReturnValue(mockSub),
    close: vi.fn().mockResolvedValue(undefined),
    jetstream: vi.fn().mockReturnValue({
      publish: vi.fn().mockResolvedValue({ stream: "TEST", seq: 1, duplicate: false }),
      streams: {
        info: vi.fn().mockResolvedValue({ config: { name: "TEST" }, state: { messages: 0 } }),
        add: vi.fn().mockResolvedValue({ config: { name: "TEST", subjects: ["test.>"] }, state: { messages: 0 } }),
        delete: vi.fn().mockResolvedValue(true),
        list: vi.fn().mockResolvedValue([]),
        message: vi.fn().mockResolvedValue({ data: new Uint8Array(), subject: "test.1", seq: 1, time: "2024-01-01" }),
      },
    }),
    info: { server: "test-server" },
  };
}

describe("NATS MCP Tools", () => {
  let mockNats: ReturnType<typeof createMockNats>;
  let tools: ReturnType<typeof createNatsTools>;

  beforeEach(() => {
    mockNats = createMockNats();
    tools = createNatsTools(mockNats);
  });

  describe("tool definitions", () => {
    it("defines all expected tools", () => {
      const names = tools.map((t) => t.definition.name).sort();
      expect(names).toEqual([
        "jetstream_create_stream",
        "jetstream_delete_stream",
        "jetstream_get_message",
        "jetstream_list_streams",
        "jetstream_publish",
        "publish",
        "subscribe",
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

  describe("publish", () => {
    it("publishes a message to a subject", async () => {
      const tool = tools.find((t) => t.definition.name === "publish")!;
      const result = await tool.handler({ subject: "test.foo", data: "hello" });

      expect(mockNats.publish).toHaveBeenCalledWith("test.foo", expect.any(Uint8Array));
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain("Published to test.foo");
    });

    it("handles publish errors", async () => {
      vi.mocked(mockNats.publish).mockRejectedValue(new Error("Connection lost"));

      const tool = tools.find((t) => t.definition.name === "publish")!;
      const result = await tool.handler({ subject: "test.foo", data: "hello" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Connection lost");
    });
  });

  describe("subscribe", () => {
    it("subscribes and collects messages", async () => {
      const mockMsg = { subject: "test.foo", data: new TextEncoder().encode("world"), reply: "", ack: vi.fn(), nak: vi.fn() };
      const mockSub = {
        [Symbol.asyncIterator]: () => ({
          next: vi.fn()
            .mockResolvedValueOnce({ done: false, value: mockMsg })
            .mockResolvedValueOnce({ done: true, value: undefined }),
          [Symbol.asyncIterator]() { return this; },
        }),
        unsubscribe: vi.fn(),
        drain: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(mockNats.subscribe).mockReturnValue(mockSub as never);

      const tool = tools.find((t) => t.definition.name === "subscribe")!;
      const result = await tool.handler({ subject: "test.>", maxMessages: 1, timeoutMs: 1000 });

      expect(mockNats.subscribe).toHaveBeenCalledWith("test.>");
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain("world");
    });
  });

  describe("jetstream_publish", () => {
    it("publishes to JetStream", async () => {
      const tool = tools.find((t) => t.definition.name === "jetstream_publish")!;
      const result = await tool.handler({ subject: "orders.new", data: '{"id":1}' });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain("TEST");
      expect(result.content[0].text).toContain("1");
    });
  });

  describe("jetstream_create_stream", () => {
    it("creates a stream", async () => {
      const tool = tools.find((t) => t.definition.name === "jetstream_create_stream")!;
      const result = await tool.handler({
        name: "ORDERS",
        subjects: ["orders.>"],
        retention: "limits",
        storage: "file",
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain("TEST");
    });
  });

  describe("jetstream_list_streams", () => {
    it("lists streams", async () => {
      const tool = tools.find((t) => t.definition.name === "jetstream_list_streams")!;
      const result = await tool.handler({});

      expect(result.isError).toBeFalsy();
    });
  });

  describe("jetstream_get_message", () => {
    it("gets a message by sequence", async () => {
      const tool = tools.find((t) => t.definition.name === "jetstream_get_message")!;
      const result = await tool.handler({ stream: "TEST", seq: 1 });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain("test.1");
    });
  });

  describe("jetstream_delete_stream", () => {
    it("deletes a stream", async () => {
      const tool = tools.find((t) => t.definition.name === "jetstream_delete_stream")!;
      const result = await tool.handler({ name: "TEST" });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain("deleted");
    });
  });
});
