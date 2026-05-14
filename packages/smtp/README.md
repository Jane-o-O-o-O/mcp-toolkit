# @mcp-toolkit/smtp

SMTP/IMAP MCP Server — send emails via SMTP, manage mailbox via IMAP.

## Tools (6)

| Tool | Description |
|------|-------------|
| `send_email` | Send an email via SMTP (To, CC, BCC, HTML) |
| `list_emails` | List recent emails from a mailbox folder |
| `read_email` | Read a specific email by UID |
| `delete_email` | Delete an email by UID |
| `list_folders` | List all mailbox folders |
| `search_emails` | Search emails by subject or sender |

## Configuration

| Environment Variable | Required | Default | Description |
|---------------------|----------|---------|-------------|
| `SMTP_HOST` | Yes | — | SMTP server hostname |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_USER` | No | — | SMTP authentication username |
| `SMTP_PASSWORD` | No | — | SMTP authentication password |
| `SMTP_SECURE` | No | `true` | Use TLS for SMTP |
| `SMTP_FROM` | No | — | Default From address |
| `IMAP_HOST` | No | — | IMAP server hostname (for reading) |
| `IMAP_PORT` | No | `993` | IMAP server port |
| `IMAP_USER` | No | — | IMAP username |
| `IMAP_PASSWORD` | No | — | IMAP password |
| `MCP_TRANSPORT` | No | `stdio` | Transport: `stdio`, `sse`, `streamable-http` |
| `MCP_PORT` | No | `3000` | Port for HTTP transport |
| `MCP_LOG_LEVEL` | No | `info` | Log level: `debug`, `info`, `warn`, `error` |

## Usage

```bash
npx @mcp-toolkit/smtp
```

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "smtp": {
      "command": "npx",
      "args": ["@mcp-toolkit/smtp"],
      "env": {
        "SMTP_HOST": "smtp.gmail.com",
        "SMTP_PORT": "587",
        "SMTP_USER": "your-email@gmail.com",
        "SMTP_PASSWORD": "your-app-password",
        "IMAP_HOST": "imap.gmail.com",
        "IMAP_PORT": "993"
      }
    }
  }
}
```

### Gmail Setup

1. Enable 2FA on your Google account
2. Generate an App Password at https://myaccount.google.com/apppasswords
3. Use the App Password as `SMTP_PASSWORD`
