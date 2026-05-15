import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const RabbitMQConfigSchema = z.object({
  url: z.string().default("http://localhost:15672"),
  username: z.string().min(1),
  password: z.string().min(1),
  ...BaseConfigFields,
});

export type RabbitMQConfig = z.infer<typeof RabbitMQConfigSchema>;

export function loadConfig(): RabbitMQConfig {
  const base = parseBaseEnvVars();
  const username = process.env.RABBITMQ_USER;
  const password = process.env.RABBITMQ_PASSWORD;
  if (!username) {
    throw new Error("RABBITMQ_USER environment variable is required");
  }
  if (!password) {
    throw new Error("RABBITMQ_PASSWORD environment variable is required");
  }
  return RabbitMQConfigSchema.parse({
    url: process.env.RABBITMQ_URL ?? "http://localhost:15672",
    username,
    password,
    ...base,
  });
}
