/** RabbitMQ client interface for testability */
export interface RabbitMQClient {
  listQueues(params?: { vhost?: string }): Promise<RabbitMQQueue[]>;
  getQueue(params: { vhost?: string; name: string }): Promise<RabbitMQQueue>;
  createQueue(params: {
    vhost?: string;
    name: string;
    durable?: boolean;
    auto_delete?: boolean;
    arguments?: Record<string, unknown>;
  }): Promise<RabbitMQQueueInfo>;
  deleteQueue(params: { vhost?: string; name: string }): Promise<void>;
  listExchanges(params?: { vhost?: string }): Promise<RabbitMQExchange[]>;
  createExchange(params: {
    vhost?: string;
    name: string;
    type?: string;
    durable?: boolean;
    auto_delete?: boolean;
    arguments?: Record<string, unknown>;
  }): Promise<RabbitMQExchangeInfo>;
  publishMessage(params: {
    vhost?: string;
    exchange: string;
    routing_key?: string;
    properties?: Record<string, unknown>;
    payload: string;
    payload_encoding?: string;
  }): Promise<RabbitMQPublishResult>;
  listConnections(): Promise<RabbitMQConnection[]>;
}

export interface RabbitMQQueue {
  name: string;
  vhost: string;
  durable: boolean;
  auto_delete: boolean;
  state: string;
  messages: number;
  messages_ready: number;
  messages_unacknowledged: number;
  consumers: number;
}

export interface RabbitMQQueueInfo {
  name: string;
  vhost: string;
  durable: boolean;
  auto_delete: boolean;
}

export interface RabbitMQExchange {
  name: string;
  vhost: string;
  type: string;
  durable: boolean;
  auto_delete: boolean;
}

export interface RabbitMQExchangeInfo {
  name: string;
  vhost: string;
  type: string;
  durable: boolean;
  auto_delete: boolean;
}

export interface RabbitMQPublishResult {
  routed: boolean;
}

export interface RabbitMQConnection {
  name: string;
  state: string;
  channels: number;
  user: string;
  peer_host: string;
  peer_port: number;
}
