import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const ElasticsearchConfigSchema = z.object({
  url: z.string().url("Invalid Elasticsearch URL").or(z.string().startsWith("http")),
  apiKey: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  ...BaseConfigFields,
});

export type ElasticsearchConfig = z.infer<typeof ElasticsearchConfigSchema>;

export function loadConfig(): ElasticsearchConfig {
  const url = process.env.ELASTICSEARCH_URL;
  if (!url) {
    throw new Error(
      "ELASTICSEARCH_URL environment variable is required. Example: http://localhost:9200",
    );
  }

  const base = parseBaseEnvVars();
  return ElasticsearchConfigSchema.parse({
    url,
    apiKey: process.env.ELASTICSEARCH_API_KEY,
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD,
    ...base,
  });
}
