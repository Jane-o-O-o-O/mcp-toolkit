/** Interface for NATS client — subset of nats.js methods used by our tools */
export interface NatsClient {
  publish(subject: string, data: Uint8Array): Promise<void>;
  subscribe(subject: string): NatsSubscription;
  close(): Promise<void>;
  /** Access JetStream manager */
  jetstream(): JetStreamClient;
  info: { server: string };
}

export interface NatsSubscription {
  [Symbol.asyncIterator](): AsyncIterableIterator<NatsMsg>;
  unsubscribe(): void;
  drain(): Promise<void>;
}

export interface NatsMsg {
  data: Uint8Array;
  subject: string;
  reply: string;
}

export interface JetStreamClient {
  publish(subject: string, data: Uint8Array): Promise<JetStreamPubAck>;
  streams: JetStreamManager;
}

export interface JetStreamPubAck {
  stream: string;
  seq: number;
  duplicate: boolean;
}

export interface JetStreamManager {
  info(stream: string): Promise<StreamInfo>;
  add(cfg: Partial<StreamConfig>): Promise<StreamInfo>;
  delete(stream: string): Promise<boolean>;
  list(): Promise<StreamInfo[]>;
  message(stream: string, seq: number): Promise<StoredMsg>;
}

export interface StreamConfig {
  name: string;
  subjects: string[];
  retention: "limits" | "interest" | "workqueue";
  max_msgs: number;
  max_bytes: number;
  max_age: number; // nanoseconds
  storage: "file" | "memory";
}

export interface StreamInfo {
  config: StreamConfig;
  state: {
    messages: number;
    bytes: number;
    first_seq: number;
    last_seq: number;
    consumer_count: number;
  };
}

export interface StoredMsg {
  data: Uint8Array;
  subject: string;
  seq: number;
  time: string;
}
