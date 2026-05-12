import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const DockerConfigSchema = z.object({
  socketPath: z.string().default("/var/run/docker.sock"),
  host: z.string().optional(),
  dockerPort: z.number().int().positive().optional(),
  ...BaseConfigFields,
});

export type DockerConfig = z.infer<typeof DockerConfigSchema>;

export function loadConfig(): DockerConfig {
  const base = parseBaseEnvVars();
  return DockerConfigSchema.parse({
    socketPath: process.env.DOCKER_SOCKET ?? "/var/run/docker.sock",
    host: process.env.DOCKER_HOST,
    port: process.env.DOCKER_PORT ? parseInt(process.env.DOCKER_PORT, 10) : undefined,
    ...base,
  });
}
