import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const KafkaConfigSchema = z.object({
  brokers: z.array(z.string()).min(1, "At least one broker is required"),
  clientId: z.string().default("mcp-toolkit-kafka"),
  sasl: z
    .object({
      mechanism: z.enum(["plain", "scram-sha-256", "scram-sha-512"]),
      username: z.string(),
      password: z.string(),
    })
    .optional(),
  ssl: z.boolean().default(false),
  ...BaseConfigFields,
});

export type KafkaConfig = z.infer<typeof KafkaConfigSchema>;

export function loadConfig(): KafkaConfig {
  const base = parseBaseEnvVars();
  const brokers = process.env.KAFKA_BROKERS?.split(",").map((b) => b.trim());
  const saslUsername = process.env.KAFKA_SASL_USERNAME;
  const saslPassword = process.env.KAFKA_SASL_PASSWORD;
  const saslMechanism = process.env.KAFKA_SASL_MECHANISM;

  const sasl =
    saslUsername && saslPassword && saslMechanism
      ? {
          mechanism: saslMechanism as "plain" | "scram-sha-256" | "scram-sha-512",
          username: saslUsername,
          password: saslPassword,
        }
      : undefined;

  return KafkaConfigSchema.parse({
    brokers: brokers ?? ["localhost:9092"],
    clientId: process.env.KAFKA_CLIENT_ID ?? "mcp-toolkit-kafka",
    sasl,
    ssl: process.env.KAFKA_SSL === "true",
    ...base,
  });
}
