import { z } from "zod";
import { BaseConfigFields, parseBaseEnvVars } from "@mcp-toolkit/core";

export const SmtpConfigSchema = z.object({
  smtpHost: z.string(),
  smtpPort: z.coerce.number().default(587),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpSecure: z.boolean().default(true),
  imapHost: z.string().optional(),
  imapPort: z.coerce.number().default(993),
  imapUser: z.string().optional(),
  imapPassword: z.string().optional(),
  defaultFrom: z.string().optional(),
  ...BaseConfigFields,
});

export type SmtpConfig = z.infer<typeof SmtpConfigSchema>;

export function loadConfig(): SmtpConfig {
  const base = parseBaseEnvVars();
  return SmtpConfigSchema.parse({
    smtpHost: process.env.SMTP_HOST ?? "",
    smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    smtpSecure: process.env.SMTP_SECURE !== "false",
    imapHost: process.env.IMAP_HOST,
    imapPort: process.env.IMAP_PORT ? parseInt(process.env.IMAP_PORT, 10) : 993,
    imapUser: process.env.IMAP_USER,
    imapPassword: process.env.IMAP_PASSWORD,
    defaultFrom: process.env.SMTP_FROM,
    ...base,
  });
}
