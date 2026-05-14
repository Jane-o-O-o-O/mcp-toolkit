import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const TerraformConfigSchema = z.object({
  workDir: z.string().default("."),
  binary: z.string().default("terraform"),
  varFile: z.string().optional(),
  autoApprove: z.boolean().default(false),
  ...BaseConfigFields,
});

export type TerraformConfig = z.infer<typeof TerraformConfigSchema>;

export function loadConfig(): TerraformConfig {
  const base = parseBaseEnvVars();
  return TerraformConfigSchema.parse({
    workDir: process.env.TF_WORK_DIR ?? ".",
    binary: process.env.TF_BINARY ?? "terraform",
    varFile: process.env.TF_VAR_FILE,
    autoApprove: process.env.TF_AUTO_APPROVE === "true",
    ...base,
  });
}
