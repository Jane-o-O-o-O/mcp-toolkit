import type { NatsClient, StreamInfo, StreamConfig, StoredMsg, NatsMsg } from "./tools/types.js";
import { createNatsTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type NatsConfig } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  nats: NatsClient;
  logger: Logger;
  config: NatsConfig;
}

/** Create a real NATS connection. Exported for testing with dependency injection. */
export async function connectNats(config: NatsConfig): Promise<NatsClient> {
  const { connect } = await import("nats");
  const opts: Record<string, unknown> = {};
  if (config.username) opts.user = config.username;
  if (config.password) opts.pass = config.password;
  if (config.token) opts.token = config.token;

  const nc = await connect({ servers: config.url, ...opts });

  return {
    publish: async (subject: string, data: Uint8Array) => { nc.publish(subject, data); await nc.flush(); },
    subscribe: (subject: string) => {
      const sub = nc.subscribe(subject);
      return {
        [Symbol.asyncIterator](): AsyncIterableIterator<NatsMsg> {
          const rawIter = sub[Symbol.asyncIterator]();
          return {
            async next() {
              const result = await rawIter.next();
              if (result.done) {
                return { done: true, value: undefined };
              }
              return {
                done: false,
                value: {
                  data: result.value.data,
                  subject: result.value.subject,
                  reply: result.value.reply ?? "",
                },
              };
            },
            async return(value?: unknown) {
              if (rawIter.return) {
                const r = await rawIter.return(value as never);
                return { done: true, value: r.value as unknown as NatsMsg };
              }
              return { done: true, value: undefined };
            },
            async throw(e?: unknown) {
              if (rawIter.throw) {
                const r = await rawIter.throw(e as never);
                return { done: r.done, value: r.value as unknown as NatsMsg };
              }
              return { done: true, value: undefined };
            },
            [Symbol.asyncIterator]() { return this; },
          };
        },
        unsubscribe: () => sub.unsubscribe(),
        drain: () => sub.drain(),
      };
    },
    close: () => nc.close(),
    jetstream: () => {
      const js = nc.jetstream();
      return {
        publish: async (subject: string, data: Uint8Array) => {
          const pa = await js.publish(subject, data);
          return {
            stream: pa.stream,
            seq: pa.seq,
            duplicate: pa.duplicate,
          };
        },
        streams: {
          info: async (stream: string): Promise<StreamInfo> => {
            const mgr = await nc.jetstreamManager();
            return (await mgr.streams.info(stream)) as unknown as StreamInfo;
          },
          add: async (cfg: Partial<StreamConfig>): Promise<StreamInfo> => {
            const mgr = await nc.jetstreamManager();
            return (await mgr.streams.add(cfg as Record<string, unknown>)) as unknown as StreamInfo;
          },
          delete: async (stream: string): Promise<boolean> => {
            const mgr = await nc.jetstreamManager();
            await mgr.streams.delete(stream);
            return true;
          },
          list: async (): Promise<StreamInfo[]> => {
            const mgr = await nc.jetstreamManager();
            const list: StreamInfo[] = [];
            const iter = await mgr.streams.list();
            for await (const info of iter) {
              list.push(info as unknown as StreamInfo);
            }
            return list;
          },
          message: async (stream: string, seq: number): Promise<StoredMsg> => {
            const mgr = await nc.jetstreamManager();
            const msg = await mgr.streams.getMessage(stream, seq);
            return {
              data: msg.data,
              subject: msg.subject,
              seq: msg.seq,
              time: String(msg.time),
            };
          },
        },
      };
    },
    info: { server: (nc.info as unknown as Record<string, string>)?.host ?? "unknown" },
  };
}

export async function createServerContextAsync(config?: Partial<NatsConfig>): Promise<ServerContext> {
  const fullConfig = config?.url
    ? {
        url: config.url,
        username: config.username,
        password: config.password,
        token: config.token,
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({
    name: "nats",
    level: fullConfig.logLevel,
  });

  const nats = await connectNats(fullConfig);
  const tools = createNatsTools(nats);
  const server = createMcpServer("@mcp-toolkit/nats", "0.1.0", tools, logger);

  return { server, nats, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "NATS", ctx.config);
}
