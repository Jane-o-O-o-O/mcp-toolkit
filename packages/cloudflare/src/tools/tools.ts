import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";
import type { CloudflareClient } from "./types.js";

export function createCloudflareTools(client: CloudflareClient): McpTool[] {
  const listZones: McpTool = {
    definition: {
      name: "cf_list_zones",
      description: "List Cloudflare zones (domains) in the account",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Maximum number of zones to return" },
          name: { type: "string", description: "Filter zones by name" },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.listZones({ limit: args.limit as number | undefined, name: args.name as string | undefined }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const getZone: McpTool = {
    definition: {
      name: "cf_get_zone",
      description: "Get details of a specific Cloudflare zone by ID",
      inputSchema: {
        type: "object",
        properties: {
          zoneId: { type: "string", description: "The zone ID" },
        },
        required: ["zoneId"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.getZone(args.zoneId as string),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const listDnsRecords: McpTool = {
    definition: {
      name: "cf_list_dns_records",
      description: "List DNS records for a Cloudflare zone",
      inputSchema: {
        type: "object",
        properties: {
          zoneId: { type: "string", description: "The zone ID" },
          type: { type: "string", description: "Filter by DNS record type (A, AAAA, CNAME, etc.)" },
          name: { type: "string", description: "Filter by DNS record name" },
          limit: { type: "number", description: "Maximum number of records to return" },
        },
        required: ["zoneId"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.listDnsRecords(args.zoneId as string, {
            type: args.type as string | undefined,
            name: args.name as string | undefined,
            limit: args.limit as number | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const createDnsRecord: McpTool = {
    definition: {
      name: "cf_create_dns_record",
      description: "Create a new DNS record in a Cloudflare zone",
      inputSchema: {
        type: "object",
        properties: {
          zoneId: { type: "string", description: "The zone ID" },
          type: { type: "string", description: "DNS record type (A, AAAA, CNAME, TXT, MX, etc.)" },
          name: { type: "string", description: "DNS record name" },
          content: { type: "string", description: "DNS record content" },
          ttl: { type: "number", description: "TTL in seconds (1 = automatic)" },
          proxied: { type: "boolean", description: "Whether the record is proxied through Cloudflare" },
        },
        required: ["zoneId", "type", "name", "content"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.createDnsRecord(args.zoneId as string, {
            type: args.type as string,
            name: args.name as string,
            content: args.content as string,
            ttl: args.ttl as number | undefined,
            proxied: args.proxied as boolean | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const deleteDnsRecord: McpTool = {
    definition: {
      name: "cf_delete_dns_record",
      description: "Delete a DNS record from a Cloudflare zone",
      inputSchema: {
        type: "object",
        properties: {
          zoneId: { type: "string", description: "The zone ID" },
          recordId: { type: "string", description: "The DNS record ID to delete" },
        },
        required: ["zoneId", "recordId"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.deleteDnsRecord(args.zoneId as string, args.recordId as string),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const listWorkers: McpTool = {
    definition: {
      name: "cf_list_workers",
      description: "List Cloudflare Workers scripts in the account",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Maximum number of workers to return" },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.listWorkers({ limit: args.limit as number | undefined }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const listKvNamespaces: McpTool = {
    definition: {
      name: "cf_list_kv_namespaces",
      description: "List Cloudflare Workers KV namespaces in the account",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Maximum number of namespaces to return" },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.listKvNamespaces({ limit: args.limit as number | undefined }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const purgeCache: McpTool = {
    definition: {
      name: "cf_purge_cache",
      description: "Purge the cache for a Cloudflare zone",
      inputSchema: {
        type: "object",
        properties: {
          zoneId: { type: "string", description: "The zone ID" },
          purge_everything: { type: "boolean", description: "Purge everything from the cache" },
          files: { type: "array", items: { type: "string" }, description: "Specific file URLs to purge" },
          tags: { type: "array", items: { type: "string" }, description: "Cache tags to purge" },
        },
        required: ["zoneId"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.purgeCache(args.zoneId as string, {
            purge_everything: args.purge_everything as boolean | undefined,
            files: args.files as string[] | undefined,
            tags: args.tags as string[] | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  return [listZones, getZone, listDnsRecords, createDnsRecord, deleteDnsRecord, listWorkers, listKvNamespaces, purgeCache];
}
