# @mcp-toolkit/nats

NATS MCP Server — publish/subscribe messaging and JetStream persistent streaming.

## Tools (7)

| Tool | Description |
|------|-------------|
| `publish` | Publish a message to a NATS subject |
| `subscribe` | Subscribe to a subject and collect messages |
| `jetstream_publish` | Publish to JetStream with acknowledgement |
| `jetstream_create_stream` | Create a JetStream stream |
| `jetstream_list_streams` | List all JetStream streams |
| `jetstream_get_message` | Get a message from a stream by sequence number |
| `jetstream_delete_stream` | Delete a JetStream stream |

## Configuration

| Env Variable | Required | Default | Description |
|-------------|----------|---------|-------------|
| `NATS_URL` | ❌ | `nats://localhost:4222` | NATS server URL |
| `NATS_USERNAME` | ❌ | — | Username for auth |
| `NATS_PASSWORD` | ❌ | — | Password for auth |
| `NATS_TOKEN` | ❌ | — | Token for auth (alternative to user/pass) |
| `MCP_LOG_LEVEL` | ❌ | `info` | Log level: debug, info, warn, error |
| `MCP_TRANSPORT` | ❌ | `stdio` | Transport: stdio, sse, streamable-http |
| `MCP_PORT` | ❌ | `3000` | Port for HTTP transports |

## Usage

```bash
# stdio (default — for Claude Desktop, Cursor)
NATS_URL=nats://localhost:4222 npx @mcp-toolkit/nats

# With authentication
NATS_URL=nats://secure:4222 NATS_USERNAME=user NATS_PASSWORD=pass npx @mcp-toolkit/nats

# HTTP mode
NATS_URL=nats://localhost:4222 MCP_TRANSPORT=streamable-http MCP_PORT=3006 npx @mcp-toolkit/nats
```

### Claude Desktop / Cursor 配置

```json
{
  "mcpServers": {
    "nats": {
      "command": "npx",
      "args": ["@mcp-toolkit/nats"],
      "env": {
        "NATS_URL": "nats://localhost:4222"
      }
    }
  }
}
```

### With JetStream

JetStream tools work out of the box — no additional configuration needed. Just ensure JetStream is enabled on your NATS server.

## Dependencies

- `nats` — Official NATS client for Node.js
