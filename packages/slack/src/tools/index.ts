import type { SlackClient } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createSlackTools(slack: SlackClient): McpTool[] {
  const listChannelsTool: McpTool = {
    definition: {
      name: "list_channels",
      description: "List Slack channels with name, topic, purpose, and member count.",
      inputSchema: {
        type: "object",
        properties: {
          exclude_archived: { type: "boolean", description: "Exclude archived channels (default: true)" },
        },
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => await slack.listChannels(args.exclude_archived as boolean ?? true),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const sendMessageTool: McpTool = {
    definition: {
      name: "send_message",
      description: "Send a message to a Slack channel. Optionally reply in a thread.",
      inputSchema: {
        type: "object",
        properties: {
          channel: { type: "string", description: "Channel ID or name (e.g. #general)" },
          text: { type: "string", description: "Message text (supports Slack mrkdwn formatting)" },
          thread_ts: { type: "string", description: "Parent message timestamp for thread replies" },
        },
        required: ["channel", "text"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => await slack.sendMessage(
          args.channel as string,
          args.text as string,
          args.thread_ts as string | undefined,
        ),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const getChannelHistoryTool: McpTool = {
    definition: {
      name: "get_channel_history",
      description: "Get recent messages from a Slack channel.",
      inputSchema: {
        type: "object",
        properties: {
          channel: { type: "string", description: "Channel ID" },
          limit: { type: "number", description: "Number of messages to return (default: 20, max: 100)" },
          oldest: { type: "string", description: "Start of time range (Unix timestamp)" },
          latest: { type: "string", description: "End of time range (Unix timestamp)" },
        },
        required: ["channel"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => await slack.getChannelHistory(
          args.channel as string,
          args.limit as number | undefined,
          args.oldest as string | undefined,
          args.latest as string | undefined,
        ),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const getThreadRepliesTool: McpTool = {
    definition: {
      name: "get_thread_replies",
      description: "Get replies in a Slack thread.",
      inputSchema: {
        type: "object",
        properties: {
          channel: { type: "string", description: "Channel ID" },
          thread_ts: { type: "string", description: "Parent message timestamp" },
          limit: { type: "number", description: "Number of replies to return (default: 100)" },
        },
        required: ["channel", "thread_ts"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => await slack.getThreadReplies(
          args.channel as string,
          args.thread_ts as string,
          args.limit as number | undefined,
        ),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const searchMessagesTool: McpTool = {
    definition: {
      name: "search_messages",
      description: "Search Slack messages by query string.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query (supports Slack search modifiers)" },
          sort: { type: "string", enum: ["timestamp", "relevance"], description: "Sort order (default: relevance)" },
          count: { type: "number", description: "Number of results (default: 20)" },
        },
        required: ["query"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => await slack.searchMessages(
          args.query as string,
          args.sort as "timestamp" | "relevance" | undefined,
          args.count as number | undefined,
        ),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const getUserInfoTool: McpTool = {
    definition: {
      name: "get_user_info",
      description: "Get detailed information about a Slack user.",
      inputSchema: {
        type: "object",
        properties: {
          user_id: { type: "string", description: "Slack user ID" },
        },
        required: ["user_id"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => await slack.getUserInfo(args.user_id as string),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const listUsersTool: McpTool = {
    definition: {
      name: "list_users",
      description: "List workspace users with name and bot status.",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max users to return (default: 100)" },
        },
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => await slack.listUsers(args.limit as number | undefined),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const addReactionTool: McpTool = {
    definition: {
      name: "add_reaction",
      description: "Add an emoji reaction to a Slack message.",
      inputSchema: {
        type: "object",
        properties: {
          channel: { type: "string", description: "Channel ID" },
          timestamp: { type: "string", description: "Message timestamp to react to" },
          name: { type: "string", description: "Emoji name without colons (e.g. thumbsup, fire)" },
        },
        required: ["channel", "timestamp", "name"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => await slack.addReaction(
          args.channel as string,
          args.timestamp as string,
          args.name as string,
        ),
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  return [
    listChannelsTool,
    sendMessageTool,
    getChannelHistoryTool,
    getThreadRepliesTool,
    searchMessagesTool,
    getUserInfoTool,
    listUsersTool,
    addReactionTool,
  ];
}
