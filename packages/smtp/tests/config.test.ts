import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, SmtpConfigSchema } from "../src/config.js";

describe("SmtpConfigSchema", () => {
  it("validates with minimal config", () => {
    const result = SmtpConfigSchema.parse({ smtpHost: "smtp.gmail.com" });
    expect(result.smtpHost).toBe("smtp.gmail.com");
    expect(result.smtpPort).toBe(587);
    expect(result.smtpSecure).toBe(true);
    expect(result.imapPort).toBe(993);
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
  });

  it("accepts full SMTP config", () => {
    const result = SmtpConfigSchema.parse({
      smtpHost: "smtp.gmail.com",
      smtpPort: 465,
      smtpUser: "user@gmail.com",
      smtpPassword: "app-password",
      smtpSecure: true,
    });
    expect(result.smtpHost).toBe("smtp.gmail.com");
    expect(result.smtpPort).toBe(465);
    expect(result.smtpUser).toBe("user@gmail.com");
  });

  it("accepts IMAP config", () => {
    const result = SmtpConfigSchema.parse({
      smtpHost: "smtp.gmail.com",
      imapHost: "imap.gmail.com",
      imapPort: 993,
      imapUser: "user@gmail.com",
      imapPassword: "app-password",
    });
    expect(result.imapHost).toBe("imap.gmail.com");
    expect(result.imapPort).toBe(993);
  });

  it("accepts default from address", () => {
    const result = SmtpConfigSchema.parse({
      smtpHost: "smtp.example.com",
      defaultFrom: "noreply@example.com",
    });
    expect(result.defaultFrom).toBe("noreply@example.com");
  });

  it("rejects missing smtpHost", () => {
    expect(() => SmtpConfigSchema.parse({})).toThrow();
  });

  it("rejects invalid log level", () => {
    expect(() => SmtpConfigSchema.parse({ smtpHost: "smtp.example.com", logLevel: "verbose" })).toThrow();
  });
});

describe("loadConfig", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("loads config from environment variables", () => {
    process.env.SMTP_HOST = "smtp.gmail.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_USER = "user@gmail.com";
    process.env.SMTP_PASSWORD = "secret";
    process.env.SMTP_SECURE = "true";
    process.env.IMAP_HOST = "imap.gmail.com";
    process.env.IMAP_PORT = "993";
    process.env.MCP_LOG_LEVEL = "debug";

    const config = loadConfig();
    expect(config.smtpHost).toBe("smtp.gmail.com");
    expect(config.smtpPort).toBe(465);
    expect(config.smtpUser).toBe("user@gmail.com");
    expect(config.smtpPassword).toBe("secret");
    expect(config.imapHost).toBe("imap.gmail.com");
    expect(config.imapPort).toBe(993);
    expect(config.logLevel).toBe("debug");
  });

  it("defaults smtpSecure to true", () => {
    process.env.SMTP_HOST = "smtp.example.com";
    delete process.env.SMTP_SECURE;

    const config = loadConfig();
    expect(config.smtpSecure).toBe(true);
  });

  it("allows disabling smtpSecure", () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_SECURE = "false";

    const config = loadConfig();
    expect(config.smtpSecure).toBe(false);
  });
});
