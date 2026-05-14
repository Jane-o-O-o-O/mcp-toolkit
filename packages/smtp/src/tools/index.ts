import type { EmailClient } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createEmailTools(email: EmailClient): McpTool[] {
  const sendEmailTool: McpTool = {
    definition: {
      name: "send_email",
      description: "Send an email via SMTP. Supports To, CC, BCC, HTML body, and attachments.",
      inputSchema: {
        type: "object",
        properties: {
          to: { type: "array", items: { type: "string" }, description: "Recipient email addresses" },
          subject: { type: "string", description: "Email subject" },
          body: { type: "string", description: "Email body (plain text or HTML)" },
          cc: { type: "array", items: { type: "string" }, description: "CC recipients" },
          bcc: { type: "array", items: { type: "string" }, description: "BCC recipients" },
          html: { type: "boolean", description: "Whether body is HTML (default: false)" },
          reply_to: { type: "string", description: "Reply-to address" },
        },
        required: ["to", "subject", "body"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => email.sendEmail({
          to: args.to as string[],
          subject: args.subject as string,
          body: args.body as string,
          cc: args.cc as string[] | undefined,
          bcc: args.bcc as string[] | undefined,
          html: args.html as boolean | undefined,
          replyTo: args.reply_to as string | undefined,
        }),
        (r) => `Email sent successfully. Message ID: ${r.messageId}. Accepted: ${r.accepted.join(", ")}`,
      ),
  };

  const listEmailsTool: McpTool = {
    definition: {
      name: "list_emails",
      description: "List recent emails from a mailbox folder via IMAP.",
      inputSchema: {
        type: "object",
        properties: {
          folder: { type: "string", description: "Mailbox folder (default: INBOX)" },
          limit: { type: "number", description: "Max emails to return (default: 20)" },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () => email.listEmails(
          args.folder as string | undefined,
          args.limit as number | undefined,
        ),
        (emails) => JSON.stringify(emails, null, 2),
      ),
  };

  const readEmailTool: McpTool = {
    definition: {
      name: "read_email",
      description: "Read a specific email by UID from a mailbox folder via IMAP.",
      inputSchema: {
        type: "object",
        properties: {
          uid: { type: "string", description: "Email UID" },
          folder: { type: "string", description: "Mailbox folder (default: INBOX)" },
        },
        required: ["uid"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => email.readEmail(
          args.uid as string,
          args.folder as string | undefined,
        ),
        (email) => JSON.stringify(email, null, 2),
      ),
  };

  const deleteEmailTool: McpTool = {
    definition: {
      name: "delete_email",
      description: "Delete an email by UID from a mailbox folder via IMAP.",
      inputSchema: {
        type: "object",
        properties: {
          uid: { type: "string", description: "Email UID to delete" },
          folder: { type: "string", description: "Mailbox folder (default: INBOX)" },
        },
        required: ["uid"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => email.deleteEmail(
          args.uid as string,
          args.folder as string | undefined,
        ),
        (r) => `Email ${r.uid} deleted from ${r.folder}`,
      ),
  };

  const listFoldersTool: McpTool = {
    definition: {
      name: "list_folders",
      description: "List all mailbox folders available via IMAP.",
      inputSchema: { type: "object", properties: {} },
    },
    handler: async () =>
      safeRun(
        async () => email.listFolders(),
        (folders) => JSON.stringify(folders, null, 2),
      ),
  };

  const searchEmailsTool: McpTool = {
    definition: {
      name: "search_emails",
      description: "Search emails by subject or sender in a mailbox folder via IMAP.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query (matches subject and sender)" },
          folder: { type: "string", description: "Mailbox folder (default: INBOX)" },
          limit: { type: "number", description: "Max results (default: 20)" },
        },
        required: ["query"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => email.searchEmails(
          args.query as string,
          args.folder as string | undefined,
          args.limit as number | undefined,
        ),
        (emails) => JSON.stringify(emails, null, 2),
      ),
  };

  return [
    sendEmailTool,
    listEmailsTool,
    readEmailTool,
    deleteEmailTool,
    listFoldersTool,
    searchEmailsTool,
  ];
}
