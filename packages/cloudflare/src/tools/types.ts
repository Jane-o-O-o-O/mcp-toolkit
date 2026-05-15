export interface CloudflareZone {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  nameServers: string[];
  createdOn: string;
}

export interface CloudflareDnsRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied?: boolean;
  zoneId: string;
  createdOn: string;
  modifiedOn: string;
}

export interface CloudflareWorker {
  id: string;
  script: string;
  createdOn: string;
  modifiedOn: string;
}

export interface CloudflareKvNamespace {
  id: string;
  title: string;
  supportsUrlEncoding?: boolean;
}

export interface CloudflareClient {
  listZones(params?: { limit?: number; name?: string }): Promise<CloudflareZone[]>;
  getZone(id: string): Promise<CloudflareZone>;
  listDnsRecords(
    zoneId: string,
    params?: { type?: string; name?: string; limit?: number }
  ): Promise<CloudflareDnsRecord[]>;
  createDnsRecord(
    zoneId: string,
    data: {
      type: string;
      name: string;
      content: string;
      ttl?: number;
      proxied?: boolean;
    }
  ): Promise<CloudflareDnsRecord>;
  deleteDnsRecord(
    zoneId: string,
    recordId: string
  ): Promise<{ success: boolean }>;
  listWorkers(params?: { limit?: number }): Promise<CloudflareWorker[]>;
  listKvNamespaces(params?: { limit?: number }): Promise<CloudflareKvNamespace[]>;
  purgeCache(
    zoneId: string,
    data: {
      purge_everything?: boolean;
      files?: string[];
      tags?: string[];
    }
  ): Promise<{ success: boolean }>;
}
