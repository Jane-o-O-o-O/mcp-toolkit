import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const NotionConfigSchema = z.object({
  apiKey: z.string().min(1, "NOTION_API_KEY is required"),
  notionVersion: z.string().default("2022-06-28"),
  ...BaseConfigFields,
});

export type NotionConfig = z.infer<typeof NotionConfigSchema>;

export function loadConfig(): NotionConfig {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    throw new Error(
      "NOTION_API_KEY environment variable is required. Create an integration at https://www.notion.so/my-integrations",
    );
  }

  const base = parseBaseEnvVars();
  return NotionConfigSchema.parse({
    apiKey,
    notionVersion: process.env.NOTION_VERSION ?? "2022-06-28",
    ...base,
  });
}
