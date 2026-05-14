import type { SlackClient } from "./tools/types.js";
import { createSlackTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type SlackConfig } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  slack: SlackClient;
  logger: Logger;
  config: SlackConfig;
}

const SLACK_API_BASE = "https://slack.com/api";

/** Create a Slack client using native fetch */
function createSlackHttpClient(config: SlackConfig): SlackClient {
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${config.botToken}`,
    "Content-Type": "application/json; charset=utf-8",
  };

  async function slackFetch<T>(method: string, body?: Record<string, unknown>): Promise<T> {
    const options: RequestInit = { method, headers };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${SLACK_API_BASE}/${method}`, options);
    if (!res.ok) {
      throw new Error(`Slack HTTP error ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as { ok: boolean; error?: string } & T;
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error ?? "unknown"}`);
    }
    return data;
  }

  return {
    async listChannels(excludeArchived = true) {
      const channels: Array<{ id: string; name: string; is_private: boolean; is_archived: boolean; num_members: number; topic?: { value: string }; purpose?: { value: string } }> = [];
      let cursor = "";
      do {
        const params: Record<string, unknown> = { exclude_archived: excludeArchived, limit: 200 };
        if (cursor) params.cursor = cursor;
        const res = await slackFetch<{
          channels: typeof channels;
          response_metadata?: { next_cursor: string };
        }>("conversations.list", params);
        channels.push(...res.channels);
        cursor = res.response_metadata?.next_cursor ?? "";
      } while (cursor);

      return channels.map((ch) => ({
        id: ch.id,
        name: ch.name,
        isPrivate: ch.is_private,
        isArchived: ch.is_archived,
        memberCount: ch.num_members,
        topic: ch.topic?.value ?? "",
        purpose: ch.purpose?.value ?? "",
      }));
    },

    async sendMessage(channel, text, threadTs) {
      const body: Record<string, unknown> = { channel, text };
      if (threadTs) body.thread_ts = threadTs;
      const res = await slackFetch<{ channel: string; ts: string; message: { text: string } }>(
        "chat.postMessage",
        body,
      );
      return { channel: res.channel, ts: res.ts, text: res.message.text };
    },

    async getChannelHistory(channel, limit = 20, oldest, latest) {
      const params: Record<string, unknown> = { channel, limit };
      if (oldest) params.oldest = oldest;
      if (latest) params.latest = latest;
      const res = await slackFetch<{
        messages: Array<{ ts: string; user: string; text: string; thread_ts?: string; reply_count?: number }>;
      }>("conversations.history", params);
      return res.messages.map((m) => ({
        ts: m.ts,
        userId: m.user,
        text: m.text,
        threadTs: m.thread_ts,
        replyCount: m.reply_count,
        timestamp: new Date(parseFloat(m.ts) * 1000).toISOString(),
      }));
    },

    async getThreadReplies(channel, threadTs, limit = 100) {
      const res = await slackFetch<{
        messages: Array<{ ts: string; user: string; text: string; thread_ts?: string }>;
      }>("conversations.replies", { channel, ts: threadTs, limit });
      return res.messages.map((m) => ({
        ts: m.ts,
        userId: m.user,
        text: m.text,
        threadTs: m.thread_ts,
        timestamp: new Date(parseFloat(m.ts) * 1000).toISOString(),
      }));
    },

    async searchMessages(query, sort = "relevance", count = 20) {
      const res = await slackFetch<{
        messages: { matches: Array<{ ts: string; channel: { id: string; name: string }; user: string; text: string }> };
      }>("search.messages", { query, sort, count });
      return res.messages.matches.map((m) => ({
        ts: m.ts,
        channelId: m.channel.id,
        channelName: m.channel.name,
        userId: m.user,
        text: m.text,
        timestamp: new Date(parseFloat(m.ts) * 1000).toISOString(),
      }));
    },

    async getUserInfo(userId) {
      const res = await slackFetch<{
        user: { id: string; name: string; real_name: string; profile: { display_name: string; title: string; tz: string }; is_bot: boolean };
      }>("users.info", { user: userId });
      const u = res.user;
      return {
        id: u.id,
        name: u.name,
        realName: u.real_name,
        displayName: u.profile.display_name,
        isBot: u.is_bot,
        title: u.profile.title,
        timezone: u.profile.tz,
      };
    },

    async listUsers(limit = 100) {
      const users: Array<{ id: string; name: string; real_name: string; is_bot: boolean }> = [];
      let cursor = "";
      do {
        const params: Record<string, unknown> = { limit: Math.min(limit - users.length, 200) };
        if (cursor) params.cursor = cursor;
        const res = await slackFetch<{
          members: typeof users;
          response_metadata?: { next_cursor: string };
        }>("users.list", params);
        users.push(...res.members);
        cursor = res.response_metadata?.next_cursor ?? "";
      } while (cursor && users.length < limit);

      return users.slice(0, limit).map((u) => ({
        id: u.id,
        name: u.name,
        realName: u.real_name,
        isBot: u.is_bot,
      }));
    },

    async addReaction(channel, timestamp, name) {
      await slackFetch<unknown>("reactions.add", { channel, timestamp, name });
      return { ok: true };
    },
  };
}

export async function createServerContext(config?: Partial<SlackConfig>): Promise<ServerContext> {
  const fullConfig = config?.botToken
    ? {
        botToken: config.botToken,
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({
    name: "slack",
    level: fullConfig.logLevel,
  });

  const slack = createSlackHttpClient(fullConfig);
  const tools = createSlackTools(slack);
  const server = createMcpServer("@mcp-toolkit/slack", "0.1.0", tools, logger);

  return { server, slack, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "Slack", {
    transport: ctx.config.transport,
    port: ctx.config.port,
  });
}
