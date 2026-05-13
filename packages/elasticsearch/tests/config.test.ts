import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ElasticsearchConfigSchema, loadConfig } from "../src/config.js";

describe("Elasticsearch Config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("ElasticsearchConfigSchema", () => {
    it("accepts valid HTTP URL", () => {
      const result = ElasticsearchConfigSchema.safeParse({
        url: "http://localhost:9200",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid HTTPS URL", () => {
      const result = ElasticsearchConfigSchema.safeParse({
        url: "https://my-es.cloud.es.io:9243",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing url", () => {
      const result = ElasticsearchConfigSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("accepts optional auth fields", () => {
      const result = ElasticsearchConfigSchema.safeParse({
        url: "http://localhost:9200",
        apiKey: "my-api-key",
        username: "elastic",
        password: "changeme",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("loadConfig", () => {
    it("loads from environment variables", () => {
      process.env.ELASTICSEARCH_URL = "http://localhost:9200";
      const config = loadConfig();
      expect(config.url).toBe("http://localhost:9200");
    });

    it("loads with API key auth", () => {
      process.env.ELASTICSEARCH_URL = "http://localhost:9200";
      process.env.ELASTICSEARCH_API_KEY = "my-key";
      const config = loadConfig();
      expect(config.apiKey).toBe("my-key");
    });

    it("loads with basic auth", () => {
      process.env.ELASTICSEARCH_URL = "http://localhost:9200";
      process.env.ELASTICSEARCH_USERNAME = "elastic";
      process.env.ELASTICSEARCH_PASSWORD = "pass";
      const config = loadConfig();
      expect(config.username).toBe("elastic");
      expect(config.password).toBe("pass");
    });

    it("throws when ELASTICSEARCH_URL is missing", () => {
      delete process.env.ELASTICSEARCH_URL;
      expect(() => loadConfig()).toThrow("ELASTICSEARCH_URL");
    });
  });
});
