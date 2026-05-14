import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const KubernetesConfigSchema = z.object({
  kubeconfig: z.string().optional(),
  context: z.string().optional(),
  namespace: z.string().default("default"),
  server: z.string().optional(),
  token: z.string().optional(),
  ...BaseConfigFields,
});

export type KubernetesConfig = z.infer<typeof KubernetesConfigSchema>;

export function loadConfig(): KubernetesConfig {
  const base = parseBaseEnvVars();
  return KubernetesConfigSchema.parse({
    kubeconfig: process.env.KUBECONFIG,
    context: process.env.K8S_CONTEXT,
    namespace: process.env.K8S_NAMESPACE ?? "default",
    server: process.env.K8S_SERVER,
    token: process.env.K8S_TOKEN,
    ...base,
  });
}
