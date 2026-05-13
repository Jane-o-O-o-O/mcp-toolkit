/**
 * Elasticsearch client interface — subset of @elastic/elasticsearch methods used by our tools.
 * This abstraction allows mocking in tests without depending on the actual client.
 */
export interface ElasticsearchClient {
  search(params: { index: string; body: unknown }): Promise<{ hits: { hits: unknown[]; total: unknown } }>;
  index(params: { index: string; id?: string; body: unknown; refresh?: string }): Promise<{ _id: string; result: string }>;
  get(params: { index: string; id: string }): Promise<{ _id: string; _source: unknown; found: boolean }>;
  delete(params: { index: string; id: string; refresh?: string }): Promise<{ _id: string; result: string }>;
  bulk(params: { body: unknown[]; refresh?: string }): Promise<{ errors: boolean; items: unknown[] }>;
  indices: {
    exists(params: { index: string }): Promise<boolean>;
    create(params: { index: string; body?: unknown }): Promise<{ acknowledged: boolean }>;
    delete(params: { index: string }): Promise<{ acknowledged: boolean }>;
    getMapping(params: { index: string }): Promise<unknown>;
    stats(params: { index: string }): Promise<unknown>;
  };
  count(params: { index: string; body?: unknown }): Promise<{ count: number }>;
  cluster: {
    health(): Promise<unknown>;
  };
  info(): Promise<unknown>;
}
