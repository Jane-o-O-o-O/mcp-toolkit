import { describe, it, expect, vi } from "vitest";
import { createEmailTools } from "../src/tools/index.js";
import type { EmailClient } from "../src/tools/types.js";

function mockEmailClient(overrides: Partial<EmailClient> = {}): EmailClient {
  return {
    sendEmail: vi.fn().mockResolvedValue({
      messageId: "abc123@smtp.example.com",
      accepted: ["user@example.com"],
      rejected: [],
    }),
    listEmails: vi.fn().mockResolvedValue([
      {
        uid: "1",
        subject: "Meeting Tomorrow",
        from: "alice@example.com",
        date: "Thu, 14 May 2026 10:00:00 +0000",
        seen: true,
        flags: ["\\Seen"],
      },
      {
        uid: "2",
        subject: "Project Update",
        from: "bob@example.com",
        date: "Thu, 14 May 2026 09:00:00 +0000",
        seen: false,
        flags: [],
      },
    ]),
    readEmail: vi.fn().mockResolvedValue({
      uid: "1",
      subject: "Meeting Tomorrow",
      from: "alice@example.com",
      to: ["me@example.com"],
      date: "Thu, 14 May 2026 10:00:00 +0000",
      seen: true,
      flags: ["\\Seen"],
      body: "Hi, let's meet tomorrow at 10am.",
      attachments: [],
      headers: { "Message-ID": "abc123@smtp.example.com" },
    }),
    deleteEmail: vi.fn().mockResolvedValue({
      uid: "1",
      folder: "INBOX",
      deleted: true,
    }),
    listFolders: vi.fn().mockResolvedValue([
      { name: "INBOX", delimiter: "/", flags: [] },
      { name: "Sent", delimiter: "/", flags: [] },
      { name: "Drafts", delimiter: "/", flags: [] },
      { name: "Trash", delimiter: "/", flags: [] },
    ]),
    searchEmails: vi.fn().mockResolvedValue([
      {
        uid: "1",
        subject: "Meeting Tomorrow",
        from: "alice@example.com",
        date: "Thu, 14 May 2026 10:00:00 +0000",
        seen: true,
        flags: ["\\Seen"],
      },
    ]),
    ...overrides,
  };
}

describe("Email tools", () => {
  it("should have 6 tools", () => {
    const tools = createEmailTools(mockEmailClient());
    expect(tools).toHaveLength(6);
  });

  describe("send_email", () => {
    it("should send an email", async () => {
      const client = mockEmailClient();
      const tools = createEmailTools(client);
      const tool = tools.find((t) => t.definition.name === "send_email")!;

      const result = await tool.handler({
        to: ["user@example.com"],
        subject: "Test Email",
        body: "Hello, this is a test.",
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("abc123@smtp.example.com");
      expect(client.sendEmail).toHaveBeenCalledWith({
        to: ["user@example.com"],
        subject: "Test Email",
        body: "Hello, this is a test.",
        cc: undefined,
        bcc: undefined,
        html: undefined,
        replyTo: undefined,
      });
    });

    it("should send with CC and BCC", async () => {
      const client = mockEmailClient();
      const tools = createEmailTools(client);
      const tool = tools.find((t) => t.definition.name === "send_email")!;

      await tool.handler({
        to: ["user@example.com"],
        subject: "CC Test",
        body: "With CC",
        cc: ["cc@example.com"],
        bcc: ["bcc@example.com"],
      });
      expect(client.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
        cc: ["cc@example.com"],
        bcc: ["bcc@example.com"],
      }));
    });
  });

  describe("list_emails", () => {
    it("should list emails from INBOX", async () => {
      const client = mockEmailClient();
      const tools = createEmailTools(client);
      const tool = tools.find((t) => t.definition.name === "list_emails")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Meeting Tomorrow");
      expect(result.content[0].text).toContain("Project Update");
    });

    it("should list emails from specified folder", async () => {
      const client = mockEmailClient();
      const tools = createEmailTools(client);
      const tool = tools.find((t) => t.definition.name === "list_emails")!;

      await tool.handler({ folder: "Sent", limit: 5 });
      expect(client.listEmails).toHaveBeenCalledWith("Sent", 5);
    });
  });

  describe("read_email", () => {
    it("should read a specific email", async () => {
      const client = mockEmailClient();
      const tools = createEmailTools(client);
      const tool = tools.find((t) => t.definition.name === "read_email")!;

      const result = await tool.handler({ uid: "1" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Meeting Tomorrow");
      expect(result.content[0].text).toContain("alice@example.com");
    });
  });

  describe("delete_email", () => {
    it("should delete an email", async () => {
      const client = mockEmailClient();
      const tools = createEmailTools(client);
      const tool = tools.find((t) => t.definition.name === "delete_email")!;

      const result = await tool.handler({ uid: "1" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("deleted");
      expect(client.deleteEmail).toHaveBeenCalledWith("1", undefined);
    });
  });

  describe("list_folders", () => {
    it("should list mailbox folders", async () => {
      const client = mockEmailClient();
      const tools = createEmailTools(client);
      const tool = tools.find((t) => t.definition.name === "list_folders")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("INBOX");
      expect(result.content[0].text).toContain("Sent");
      expect(result.content[0].text).toContain("Drafts");
    });
  });

  describe("search_emails", () => {
    it("should search emails", async () => {
      const client = mockEmailClient();
      const tools = createEmailTools(client);
      const tool = tools.find((t) => t.definition.name === "search_emails")!;

      const result = await tool.handler({ query: "Meeting" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Meeting Tomorrow");
    });
  });

  describe("error handling", () => {
    it("should return error on send failure", async () => {
      const client = mockEmailClient({
        sendEmail: vi.fn().mockRejectedValue(new Error("Connection refused")),
      });
      const tools = createEmailTools(client);
      const tool = tools.find((t) => t.definition.name === "send_email")!;

      const result = await tool.handler({
        to: ["user@example.com"],
        subject: "Fail",
        body: "Test",
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Connection refused");
    });
  });
});
