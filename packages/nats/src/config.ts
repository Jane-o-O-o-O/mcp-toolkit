import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const NatsConfigSchema = z.object({
  url: z.string().default("nats://localhost:4222"),
  username: z.string().optional(),
  password: z.string().optional(),
  token: z.string().optional(),
  ...BaseConfigFields,
});

export type NatsConfig = z.infer<typeof NatsConfigSchema>;

export function loadConfig(): NatsConfig {
  const base = parseBaseEnvVars();
  return NatsConfigSchema.parse({
    url: process.env.NATS_URL ?? "nats://localhost:4222",
    username: process.env.NATS_USERNAME,
    password: process.env.NATS_PASSWORD,
    token: process.env.NATS_TOKEN,
    ...base,
  });
}
