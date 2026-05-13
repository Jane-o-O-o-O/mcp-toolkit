/** Interface for Prometheus HTTP API client — allows mocking in tests */
export interface PrometheusClient {
  /** Make a GET request to the Prometheus API */
  get(path: string, params?: Record<string, string>): Promise<unknown>;
}

/** Create a real Prometheus client using fetch */
export function createPrometheusClient(
  baseUrl: string,
  auth?: { username: string; password: string },
): PrometheusClient {
  const headers: Record<string, string> = {
    "Accept": "application/json",
  };

  if (auth) {
    const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString("base64");
    headers["Authorization"] = `Basic ${encoded}`;
  }

  return {
    async get(path: string, params?: Record<string, string>): Promise<unknown> {
      const url = new URL(path, baseUrl);
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          url.searchParams.set(key, value);
        }
      }

      const response = await fetch(url.toString(), { headers });
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Prometheus API error (${response.status}): ${body}`);
      }

      const data = await response.json() as Record<string, unknown>;
      if (data.status === "error") {
        throw new Error(`Prometheus query error: ${data.error ?? data.errorType}`);
      }
      return data;
    },
  };
}
