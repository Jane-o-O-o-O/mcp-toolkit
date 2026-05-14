import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const AnsibleConfigSchema = z.object({
  inventory: z.string().optional(),
  playbookDir: z.string().default("."),
  binary: z.string().default("ansible-playbook"),
  vaultPasswordFile: z.string().optional(),
  privateKey: z.string().optional(),
  extraVars: z.record(z.string()).optional(),
  ...BaseConfigFields,
});

export type AnsibleConfig = z.infer<typeof AnsibleConfigSchema>;

export function loadConfig(): AnsibleConfig {
  const base = parseBaseEnvVars();
  return AnsibleConfigSchema.parse({
    inventory: process.env.ANSIBLE_INVENTORY,
    playbookDir: process.env.ANSIBLE_PLAYBOOK_DIR ?? ".",
    binary: process.env.ANSIBLE_BINARY ?? "ansible-playbook",
    vaultPasswordFile: process.env.ANSIBLE_VAULT_PASSWORD_FILE,
    privateKey: process.env.ANSIBLE_PRIVATE_KEY,
    ...base,
  });
}
