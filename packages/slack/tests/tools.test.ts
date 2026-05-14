import { describe, it, expect, vi } from "vitest";
import { createSlackTools } from "../src/tools/index.js";
import type { SlackClient } from "../src/tools/types.js";

function mockSlackClient(overrides: Partial<SlackClient> = {}): SlackClient {
  return {
    listChannels: vi.fn().mockResolvedValue([
      { id: "C001", name: "general", isPrivate: false, isArchived: false, memberCount: 50, topic: "Company news", purpose: "General discussion" },
      { id: "C002", name: "engineering", isPrivate: false, isArchived: false, memberCount: 25, topic: "Tech talk", purpose: "Engineering team" },
    ]),
    sendMessage: vi.fn().mockResolvedValue({ channel: "C001", ts: "1700000000.000001", text: "Hello!" }),
    getChannelHistory: vi.fn().mockResolvedValue([
      { ts: "1700000000.000001", userId: "U001", text: "Hi everyone!", timestamp: "2025-11-14T22:13:20.000Z" },
      { ts: "1700000001.000002", userId: "U002", text: "Hey!", threadTs: "1700000000.000001", replyCount: 3, timestamp: "2025-11-14T22:13:21.000Z" },
    ]),
    getThreadReplies: vi.fn().mockResolvedValue([
      { ts: "1700000000.000001", userId: "U001", text: "Original", timestamp: "2025-11-14T22:13:20.000Z" },
      { ts: "1700000002.000003", userId: "U003", text: "Reply 1", threadTs: "1700000000.000001", timestamp: "2025-11-14T22:13:22.000Z" },
    ]),
    searchMessages: vi.fn().mockResolvedValue([
      { ts: "1700000000.000001", channelId: "C001", channelName: "general", userId: "U001", text: "Found message", timestamp: "2025-11-14T22:13:20.000Z" },
    ]),
    getUserInfo: vi.fn().mockResolvedValue({
      id: "U001", name: "johndoe", realName: "John Doe", displayName: "john", isBot: false, title: "Engineer", timezone: "America/New_York",
    }),
    listUsers: vi.fn().mockResolvedValue([
      { id: "U001", name: "johndoe", realName: "John Doe", isBot: false },
      { id: "U002", name: "bot", realName: "Slackbot", isBot: true },
    ]),
    addReaction: vi.fn().mockResolvedValue({ ok: true }),
    ...overrides,
  };
}

describe("Slack tools", () => {
  it("should have 8 tools", () => {
    const tools = createSlackTools(mockSlackClient());
    expect(tools).toHaveLength(8);
  });

  describe("list_channels", () => {
    it("should list channels", async () => {
      const client = mockSlackClient();
      const tools = createSlackTools(client);
      const tool = tools.find((t) => t.definition.name === "list_channels")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("general");
      expect(result.content[0].text).toContain("engineering");
    });
  });

  describe("send_message", () => {
    it("should send a message", async () => {
      const client = mockSlackClient();
      const tools = createSlackTools(client);
      const tool = tools.find((t) => t.definition.name === "send_message")!;

      const result = await tool.handler({ channel: "C001", text: "Hello!" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Hello!");
      expect(client.sendMessage).toHaveBeenCalledWith("C001", "Hello!", undefined);
    });

    it("should send a threaded reply", async () => {
      const client = mockSlackClient();
      const tools = createSlackTools(client);
      const tool = tools.find((t) => t.definition.name === "send_message")!;

      await tool.handler({ channel: "C001", text: "Reply!", thread_ts: "1700000000.000001" });
      expect(client.sendMessage).toHaveBeenCalledWith("C001", "Reply!", "1700000000.000001");
    });
  });

  describe("get_channel_history", () => {
    it("should get channel history", async () => {
      const client = mockSlackClient();
      const tools = createSlackTools(client);
      const tool = tools.find((t) => t.definition.name === "get_channel_history")!;

      const result = await tool.handler({ channel: "C001", limit: 10 });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Hi everyone!");
    });
  });

  describe("get_thread_replies", () => {
    it("should get thread replies", async () => {
      const client = mockSlackClient();
      const tools = createSlackTools(client);
      const tool = tools.find((t) => t.definition.name === "get_thread_replies")!;

      const result = await tool.handler({ channel: "C001", thread_ts: "1700000000.000001" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Reply 1");
    });
  });

  describe("search_messages", () => {
    it("should search messages", async () => {
      const client = mockSlackClient();
      const tools = createSlackTools(client);
      const tool = tools.find((t) => t.definition.name === "search_messages")!;

      const result = await tool.handler({ query: "deploy" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Found message");
    });
  });

  describe("get_user_info", () => {
    it("should get user info", async () => {
      const client = mockSlackClient();
      const tools = createSlackTools(client);
      const tool = tools.find((t) => t.definition.name === "get_user_info")!;

      const result = await tool.handler({ user_id: "U001" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("John Doe");
      expect(result.content[0].text).toContain("Engineer");
    });
  });

  describe("list_users", () => {
    it("should list users", async () => {
      const client = mockSlackClient();
      const tools = createSlackTools(client);
      const tool = tools.find((t) => t.definition.name === "list_users")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("johndoe");
      expect(result.content[0].text).toContain("Slackbot");
    });
  });

  describe("add_reaction", () => {
    it("should add a reaction", async () => {
      const client = mockSlackClient();
      const tools = createSlackTools(client);
      const tool = tools.find((t) => t.definition.name === "add_reaction")!;

      const result = await tool.handler({
        channel: "C001",
        timestamp: "1700000000.000001",
        name: "thumbsup",
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("ok");
    });
  });

  describe("error handling", () => {
    it("should return error on API failure", async () => {
      const client = mockSlackClient({
        sendMessage: vi.fn().mockRejectedValue(new Error("channel_not_found")),
      });
      const tools = createSlackTools(client);
      const tool = tools.find((t) => t.definition.name === "send_message")!;

      const result = await tool.handler({ channel: "C999", text: "test" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("channel_not_found");
    });
  });
});
