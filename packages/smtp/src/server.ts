import type { EmailClient } from "./tools/types.js";
import { createEmailTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type SmtpConfig } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  email: EmailClient;
  logger: Logger;
  config: SmtpConfig;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Create an email client using the SMTP/IMAP configuration.
 * Uses dynamic imports for nodemailer and imap to keep dependencies optional.
 * If the modules are not installed, the corresponding operations will throw.
 */
function createEmailClient(config: SmtpConfig): EmailClient {
  return {
    async sendEmail(params) {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: config.smtpUser
          ? { user: config.smtpUser, pass: config.smtpPassword ?? "" }
          : undefined,
      });

      const result = await transporter.sendMail({
        from: config.defaultFrom ?? params.to[0],
        to: params.to.join(", "),
        cc: params.cc?.join(", "),
        bcc: params.bcc?.join(", "),
        subject: params.subject,
        [params.html ? "html" : "text"]: params.body,
        replyTo: params.replyTo,
      });

      return {
        messageId: result.messageId ?? "unknown",
        accepted: (result.accepted as string[]) ?? params.to,
        rejected: (result.rejected as string[]) ?? [],
      };
    },

    async listEmails(folder = "INBOX", limit = 20) {
      const { default: Imap } = await import("imap");
      const imap = new Imap({
        user: config.imapUser ?? config.smtpUser ?? "",
        password: config.imapPassword ?? config.smtpPassword ?? "",
        host: config.imapHost ?? config.smtpHost,
        port: config.imapPort,
        tls: true,
      });

      return new Promise((resolve, reject) => {
        imap.once("ready", () => {
          imap.openBox(folder, true, (err: Error | null, box: any) => {
            if (err) {
              imap.end();
              reject(err);
              return;
            }
            const total = Math.min(box.messages.total, limit);
            const start = Math.max(1, box.messages.total - total + 1);
            const f = imap.seq.fetch(`${start}:${box.messages.total}`, {
              bodies: ["HEADER.FIELDS (FROM SUBJECT DATE)"],
              struct: true,
            });
            const emails: Array<{
              uid: string;
              subject: string;
              from: string;
              date: string;
              seen: boolean;
              flags: string[];
            }> = [];
            f.on("message", (msg: any, seqno: number) => {
              let uid = String(seqno);
              let header = "";
              msg.on("attributes", (attrs: any) => {
                uid = String(attrs.uid);
              });
              msg.on("body", (stream: any) => {
                stream.on("data", (chunk: Buffer) => {
                  header += chunk.toString();
                });
              });
              msg.once("end", () => {
                const subjectMatch = header.match(/Subject:\s*(.*)/i);
                const fromMatch = header.match(/From:\s*(.*)/i);
                const dateMatch = header.match(/Date:\s*(.*)/i);
                emails.push({
                  uid,
                  subject: subjectMatch?.[1]?.trim() ?? "(no subject)",
                  from: fromMatch?.[1]?.trim() ?? "unknown",
                  date: dateMatch?.[1]?.trim() ?? "",
                  seen: false,
                  flags: [],
                });
              });
            });
            f.once("end", () => {
              imap.end();
              resolve(emails.reverse());
            });
          });
        });
        imap.once("error", (err: Error) => reject(err));
        imap.connect();
      });
    },

    async readEmail(_uid: string, _folder = "INBOX") {
      throw new Error("readEmail requires IMAP connection — use list_emails first");
    },

    async deleteEmail(uid: string, folder = "INBOX") {
      const { default: Imap } = await import("imap");
      const imap = new Imap({
        user: config.imapUser ?? config.smtpUser ?? "",
        password: config.imapPassword ?? config.smtpPassword ?? "",
        host: config.imapHost ?? config.smtpHost,
        port: config.imapPort,
        tls: true,
      });

      return new Promise((resolve, reject) => {
        imap.once("ready", () => {
          imap.openBox(folder, false, (err: Error | null) => {
            if (err) {
              imap.end();
              reject(err);
              return;
            }
            imap.addFlags(uid, ["\\Deleted"], (err2: Error | null) => {
              if (err2) {
                imap.end();
                reject(err2);
                return;
              }
              imap.end();
              resolve({ uid, folder, deleted: true });
            });
          });
        });
        imap.once("error", (err: Error) => reject(err));
        imap.connect();
      });
    },

    async listFolders() {
      const { default: Imap } = await import("imap");
      const imap = new Imap({
        user: config.imapUser ?? config.smtpUser ?? "",
        password: config.imapPassword ?? config.smtpPassword ?? "",
        host: config.imapHost ?? config.smtpHost,
        port: config.imapPort,
        tls: true,
      });

      return new Promise((resolve, reject) => {
        imap.once("ready", () => {
          imap.getBoxes((err: Error | null, boxes: Record<string, { delimiter?: string }>) => {
            if (err) {
              imap.end();
              reject(err);
              return;
            }
            const folders = Object.entries(boxes).map(([name, box]) => ({
              name,
              delimiter: box.delimiter ?? "/",
              flags: [],
            }));
            imap.end();
            resolve(folders);
          });
        });
        imap.once("error", (err: Error) => reject(err));
        imap.connect();
      });
    },

    async searchEmails(query: string, folder = "INBOX", limit = 20) {
      const { default: Imap } = await import("imap");
      const imap = new Imap({
        user: config.imapUser ?? config.smtpUser ?? "",
        password: config.imapPassword ?? config.smtpPassword ?? "",
        host: config.imapHost ?? config.smtpHost,
        port: config.imapPort,
        tls: true,
      });

      return new Promise((resolve, reject) => {
        imap.once("ready", () => {
          imap.openBox(folder, true, (err: Error | null, _box: any) => {
            if (err) {
              imap.end();
              reject(err);
              return;
            }
            imap.search(["ALL"], (err2: Error | null, uids: number[]) => {
              if (err2) {
                imap.end();
                reject(err2);
                return;
              }
              if (!uids.length) {
                imap.end();
                resolve([]);
                return;
              }
              const f = imap.fetch(uids.slice(-limit), {
                bodies: ["HEADER.FIELDS (FROM SUBJECT DATE)"],
                struct: true,
              });
              const emails: Array<{
                uid: string;
                subject: string;
                from: string;
                date: string;
                seen: boolean;
                flags: string[];
              }> = [];
              f.on("message", (msg: any, seqno: number) => {
                let uid = String(seqno);
                let header = "";
                msg.on("attributes", (attrs: any) => {
                  uid = String(attrs.uid);
                });
                msg.on("body", (stream: any) => {
                  stream.on("data", (chunk: Buffer) => {
                    header += chunk.toString();
                  });
                });
                msg.once("end", () => {
                  const subject = header.match(/Subject:\s*(.*)/i)?.[1]?.trim() ?? "";
                  const from = header.match(/From:\s*(.*)/i)?.[1]?.trim() ?? "";
                  const q = query.toLowerCase();
                  if (subject.toLowerCase().includes(q) || from.toLowerCase().includes(q)) {
                    emails.push({
                      uid,
                      subject: subject || "(no subject)",
                      from: from || "unknown",
                      date: header.match(/Date:\s*(.*)/i)?.[1]?.trim() ?? "",
                      seen: false,
                      flags: [],
                    });
                  }
                });
              });
              f.once("end", () => {
                imap.end();
                resolve(emails.reverse());
              });
            });
          });
        });
        imap.once("error", (err: Error) => reject(err));
        imap.connect();
      });
    },
  };
}

export async function createServerContext(config?: Partial<SmtpConfig>): Promise<ServerContext> {
  const fullConfig = config?.smtpHost
    ? {
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort ?? 587,
        smtpUser: config.smtpUser,
        smtpPassword: config.smtpPassword,
        smtpSecure: config.smtpSecure ?? true,
        imapHost: config.imapHost,
        imapPort: config.imapPort ?? 993,
        imapUser: config.imapUser,
        imapPassword: config.imapPassword,
        defaultFrom: config.defaultFrom,
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({ name: "smtp", level: fullConfig.logLevel });
  const email = createEmailClient(fullConfig);
  const tools = createEmailTools(email);
  const server = createMcpServer("@mcp-toolkit/smtp", "0.1.0", tools, logger);

  return { server, email, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "SMTP", {
    transport: ctx.config.transport,
    port: ctx.config.port,
  });
}
