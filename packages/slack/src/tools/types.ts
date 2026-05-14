/** Slack client interface for testability */
export interface SlackClient {
  listChannels(excludeArchived?: boolean): Promise<ChannelSummary[]>;
  sendMessage(channel: string, text: string, threadTs?: string): Promise<SendMessageResult>;
  getChannelHistory(channel: string, limit?: number, oldest?: string, latest?: string): Promise<Message[]>;
  getThreadReplies(channel: string, threadTs: string, limit?: number): Promise<Message[]>;
  searchMessages(query: string, sort?: "timestamp" | "relevance", count?: number): Promise<SearchResult[]>;
  getUserInfo(userId: string): Promise<UserInfo>;
  listUsers(limit?: number): Promise<UserSummary[]>;
  addReaction(channel: string, timestamp: string, name: string): Promise<ReactionResult>;
}

export interface ChannelSummary {
  id: string;
  name: string;
  isPrivate: boolean;
  isArchived: boolean;
  memberCount: number;
  topic: string;
  purpose: string;
}

export interface SendMessageResult {
  channel: string;
  ts: string;
  text: string;
}

export interface Message {
  ts: string;
  userId: string;
  text: string;
  threadTs?: string;
  replyCount?: number;
  timestamp: string;
}

export interface SearchResult {
  ts: string;
  channelId: string;
  channelName: string;
  userId: string;
  text: string;
  timestamp: string;
}

export interface UserInfo {
  id: string;
  name: string;
  realName: string;
  displayName: string;
  isBot: boolean;
  title: string;
  timezone: string;
}

export interface UserSummary {
  id: string;
  name: string;
  realName: string;
  isBot: boolean;
}

export interface ReactionResult {
  ok: boolean;
}
