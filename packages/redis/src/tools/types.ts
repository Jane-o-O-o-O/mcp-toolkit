/**
 * Redis client interface — subset of ioredis methods used by our tools.
 * This abstraction allows mocking in tests without depending on ioredis.
 */
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: (string | number)[]): Promise<string>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  hget(key: string, field: string): Promise<string | null>;
  hset(key: string, field: string, value: string): Promise<number>;
  hgetall(key: string): Promise<Record<string, string>>;
  hdel(key: string, ...fields: string[]): Promise<number>;
  publish(channel: string, message: string): Promise<number>;
  info(section?: string): Promise<string>;
  ttl(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  type(key: string): Promise<string>;
  llen(key: string): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  scard(key: string): Promise<number>;
  smembers(key: string): Promise<string[]>;
  zcard(key: string): Promise<number>;
  zrange(key: string, start: number, stop: number, ...args: string[]): Promise<string[]>;
  ping(): Promise<string>;
  quit(): Promise<string>;
}
