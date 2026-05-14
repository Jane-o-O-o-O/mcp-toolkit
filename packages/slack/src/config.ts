import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const SlackConfigSchema = z.object({
  botToken: z.string().min(1, "SLACK_BOT_TOKEN is required"),
  ...BaseConfigFields,
});

export type SlackConfig = z.infer<typeof SlackConfigSchema>;

export function loadConfig(): SlackConfig {
  const botToken = process.env.SLACK_BOT_TOKEN;
  if (!botToken) {
    throw new Error(
      "SLACK_BOT_TOKEN environment variable is required. Create a Slack app at https://api.slack.com/apps",
    );
  }

  const base = parseBaseEnvVars();
  return SlackConfigSchema.parse({
    botToken,
    ...base,
  });
}
