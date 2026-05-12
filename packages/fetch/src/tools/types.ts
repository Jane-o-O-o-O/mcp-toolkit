/** HTTP fetcher interface for testability */
export interface FetchClient {
  request(options: FetchRequest): Promise<FetchResponse>;
}

export interface FetchRequest {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

export interface FetchResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}

export function createFetchClient(defaultHeaders: Record<string, string> = {}): FetchClient {
  return {
    async request(options: FetchRequest): Promise<FetchResponse> {
      const controller = new AbortController();
      const timeout = options.timeout ?? 30_000;
      const timer = setTimeout(() => controller.abort(), timeout);

      try {
        const headers: Record<string, string> = {
          ...defaultHeaders,
          ...options.headers,
        };

        const response = await fetch(options.url, {
          method: options.method,
          headers,
          body: options.body,
          signal: controller.signal,
        });

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        const body = await response.text();

        return {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          body,
        };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
