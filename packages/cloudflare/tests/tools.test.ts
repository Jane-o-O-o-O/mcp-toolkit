import { describe, it, expect, vi } from "vitest";
import { createCloudflareTools } from "../src/tools/index.js";
import type { CloudflareClient } from "../src/tools/types.js";

function mockCloudflareClient(overrides: Partial<CloudflareClient> = {}): CloudflareClient {
  return {
    listZones: vi.fn().mockResolvedValue([
      {
        id: "zone-1",
        name: "example.com",
        status: "active",
        paused: false,
        nameServers: ["ns1.example.com"],
        createdOn: "2024-01-01T00:00:00Z",
      },
    ]),
    getZone: vi.fn().mockResolvedValue({
      id: "zone-1",
      name: "example.com",
      status: "active",
      paused: false,
      nameServers: ["ns1.example.com"],
      createdOn: "2024-01-01T00:00:00Z",
    }),
    listDnsRecords: vi.fn().mockResolvedValue([
      {
        id: "rec-1",
        type: "A",
        name: "example.com",
        content: "1.2.3.4",
        ttl: 300,
        proxied: true,
        zoneId: "zone-1",
        createdOn: "2024-01-01T00:00:00Z",
        modifiedOn: "2024-01-01T00:00:00Z",
      },
    ]),
    createDnsRecord: vi.fn().mockResolvedValue({
      id: "rec-2",
      type: "CNAME",
      name: "www.example.com",
      content: "example.com",
      ttl: 1,
      proxied: true,
      zoneId: "zone-1",
      createdOn: "2024-01-01T00:00:00Z",
      modifiedOn: "2024-01-01T00:00:00Z",
    }),
    deleteDnsRecord: vi.fn().mockResolvedValue({ success: true }),
    listWorkers: vi.fn().mockResolvedValue([
      {
        id: "worker-1",
        script: "my-worker",
        createdOn: "2024-01-01T00:00:00Z",
        modifiedOn: "2024-01-01T00:00:00Z",
      },
    ]),
    listKvNamespaces: vi.fn().mockResolvedValue([
      { id: "kv-1", title: "MY_KV", supportsUrlEncoding: false },
    ]),
    purgeCache: vi.fn().mockResolvedValue({ success: true }),
    ...overrides,
  };
}

describe("Cloudflare tools", () => {
  it("should have 8 tools", () => {
    const tools = createCloudflareTools(mockCloudflareClient());
    expect(tools).toHaveLength(8);
  });

  describe("cf_list_zones", () => {
    it("should list zones", async () => {
      const client = mockCloudflareClient();
      const tools = createCloudflareTools(client);
      const tool = tools.find((t) => t.definition.name === "cf_list_zones")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("example.com");
      expect(client.listZones).toHaveBeenCalled();
    });

    it("should pass limit and name params", async () => {
      const client = mockCloudflareClient();
      const tools = createCloudflareTools(client);
      const tool = tools.find((t) => t.definition.name === "cf_list_zones")!;

      await tool.handler({ limit: 10, name: "example.com" });
      expect(client.listZones).toHaveBeenCalledWith({ limit: 10, name: "example.com" });
    });
  });

  describe("cf_get_zone", () => {
    it("should get a zone by id", async () => {
      const client = mockCloudflareClient();
      const tools = createCloudflareTools(client);
      const tool = tools.find((t) => t.definition.name === "cf_get_zone")!;

      const result = await tool.handler({ zoneId: "zone-1" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("example.com");
      expect(client.getZone).toHaveBeenCalledWith("zone-1");
    });
  });

  describe("cf_list_dns_records", () => {
    it("should list DNS records", async () => {
      const client = mockCloudflareClient();
      const tools = createCloudflareTools(client);
      const tool = tools.find((t) => t.definition.name === "cf_list_dns_records")!;

      const result = await tool.handler({ zoneId: "zone-1", type: "A" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("1.2.3.4");
      expect(client.listDnsRecords).toHaveBeenCalledWith("zone-1", {
        type: "A",
        name: undefined,
        limit: undefined,
      });
    });
  });

  describe("cf_create_dns_record", () => {
    it("should create a DNS record", async () => {
      const client = mockCloudflareClient();
      const tools = createCloudflareTools(client);
      const tool = tools.find((t) => t.definition.name === "cf_create_dns_record")!;

      const result = await tool.handler({
        zoneId: "zone-1",
        type: "CNAME",
        name: "www.example.com",
        content: "example.com",
        proxied: true,
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("www.example.com");
      expect(client.createDnsRecord).toHaveBeenCalledWith("zone-1", {
        type: "CNAME",
        name: "www.example.com",
        content: "example.com",
        ttl: undefined,
        proxied: true,
      });
    });
  });

  describe("cf_delete_dns_record", () => {
    it("should delete a DNS record", async () => {
      const client = mockCloudflareClient();
      const tools = createCloudflareTools(client);
      const tool = tools.find((t) => t.definition.name === "cf_delete_dns_record")!;

      const result = await tool.handler({ zoneId: "zone-1", recordId: "rec-1" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("true");
      expect(client.deleteDnsRecord).toHaveBeenCalledWith("zone-1", "rec-1");
    });
  });

  describe("cf_list_workers", () => {
    it("should list workers", async () => {
      const client = mockCloudflareClient();
      const tools = createCloudflareTools(client);
      const tool = tools.find((t) => t.definition.name === "cf_list_workers")!;

      const result = await tool.handler({ limit: 5 });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("my-worker");
      expect(client.listWorkers).toHaveBeenCalledWith({ limit: 5 });
    });
  });

  describe("cf_list_kv_namespaces", () => {
    it("should list KV namespaces", async () => {
      const client = mockCloudflareClient();
      const tools = createCloudflareTools(client);
      const tool = tools.find((t) => t.definition.name === "cf_list_kv_namespaces")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("MY_KV");
      expect(client.listKvNamespaces).toHaveBeenCalledWith({ limit: undefined });
    });
  });

  describe("cf_purge_cache", () => {
    it("should purge everything", async () => {
      const client = mockCloudflareClient();
      const tools = createCloudflareTools(client);
      const tool = tools.find((t) => t.definition.name === "cf_purge_cache")!;

      const result = await tool.handler({ zoneId: "zone-1", purge_everything: true });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("true");
      expect(client.purgeCache).toHaveBeenCalledWith("zone-1", {
        purge_everything: true,
        files: undefined,
        tags: undefined,
      });
    });

    it("should purge specific files", async () => {
      const client = mockCloudflareClient();
      const tools = createCloudflareTools(client);
      const tool = tools.find((t) => t.definition.name === "cf_purge_cache")!;

      await tool.handler({ zoneId: "zone-1", files: ["https://example.com/style.css"] });
      expect(client.purgeCache).toHaveBeenCalledWith("zone-1", {
        purge_everything: undefined,
        files: ["https://example.com/style.css"],
        tags: undefined,
      });
    });

    it("should purge by tags", async () => {
      const client = mockCloudflareClient();
      const tools = createCloudflareTools(client);
      const tool = tools.find((t) => t.definition.name === "cf_purge_cache")!;

      await tool.handler({ zoneId: "zone-1", tags: ["blog-posts"] });
      expect(client.purgeCache).toHaveBeenCalledWith("zone-1", {
        purge_everything: undefined,
        files: undefined,
        tags: ["blog-posts"],
      });
    });
  });

  describe("error handling", () => {
    it("should return error on API failure", async () => {
      const client = mockCloudflareClient({
        listZones: vi.fn().mockRejectedValue(new Error("Invalid API token")),
      });
      const tools = createCloudflareTools(client);
      const tool = tools.find((t) => t.definition.name === "cf_list_zones")!;

      const result = await tool.handler({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Invalid API token");
    });
  });
});
