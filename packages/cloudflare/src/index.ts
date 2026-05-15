#!/usr/bin/env node

import { createServerContext, startServer } from "./server.js";
import { loadConfig } from "./config.js";
import type {
  CloudflareClient,
  CloudflareZone,
  CloudflareDnsRecord,
  CloudflareWorker,
  CloudflareKvNamespace,
} from "./tools/types.js";

/**
 * Creates a CloudflareClient that uses the Cloudflare API.
 */
function createCloudflareClient(): CloudflareClient {
  const config = loadConfig();

  async function cfFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${config.baseUrl}${path}`;
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Cloudflare API error ${response.status}: ${body}`
      );
    }

    const json = (await response.json()) as { result: T; success: boolean };
    if (!json.success) {
      throw new Error(`Cloudflare API returned success=false`);
    }
    return json.result;
  }

  return {
    async listZones(params) {
      const qs = new URLSearchParams();
      if (params?.limit) qs.set("per_page", String(params.limit));
      if (params?.name) qs.set("name", params.name);
      return cfFetch<CloudflareZone[]>(`/zones?${qs.toString()}`);
    },

    async getZone(id) {
      return cfFetch<CloudflareZone>(`/zones/${encodeURIComponent(id)}`);
    },

    async listDnsRecords(zoneId, params) {
      const qs = new URLSearchParams();
      if (params?.type) qs.set("type", params.type);
      if (params?.name) qs.set("name", params.name);
      if (params?.limit) qs.set("per_page", String(params.limit));
      return cfFetch<CloudflareDnsRecord[]>(
        `/zones/${encodeURIComponent(zoneId)}/dns_records?${qs.toString()}`
      );
    },

    async createDnsRecord(zoneId, data) {
      return cfFetch<CloudflareDnsRecord>(
        `/zones/${encodeURIComponent(zoneId)}/dns_records`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
    },

    async deleteDnsRecord(zoneId, recordId) {
      await cfFetch<unknown>(
        `/zones/${encodeURIComponent(zoneId)}/dns_records/${encodeURIComponent(recordId)}`,
        { method: "DELETE" }
      );
      return { success: true };
    },

    async listWorkers(params) {
      const qs = new URLSearchParams();
      if (params?.limit) qs.set("per_page", String(params.limit));
      return cfFetch<CloudflareWorker[]>(
        `/accounts/${encodeURIComponent(config.accountId)}/workers/scripts?${qs.toString()}`
      );
    },

    async listKvNamespaces(params) {
      const qs = new URLSearchParams();
      if (params?.limit) qs.set("per_page", String(params.limit));
      return cfFetch<CloudflareKvNamespace[]>(
        `/accounts/${encodeURIComponent(config.accountId)}/storage/kv/namespaces?${qs.toString()}`
      );
    },

    async purgeCache(zoneId, data) {
      await cfFetch<unknown>(
        `/zones/${encodeURIComponent(zoneId)}/purge_cache`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      return { success: true };
    },
  };
}

async function main(): Promise<void> {
  let ctx;
  try {
    const client = createCloudflareClient();
    ctx = createServerContext(client);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to start: ${message}`);
    process.exit(1);
  }

  const shutdown = async () => {
    ctx.logger.info("Shutting down...");
    await ctx.server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await startServer(ctx);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
