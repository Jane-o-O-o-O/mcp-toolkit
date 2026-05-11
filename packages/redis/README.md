# 🔴 @mcp-toolkit/redis

Redis MCP Server — cache operations, pub/sub, key management via the Model Context Protocol.

## Tools (11)

| Tool | Description |
|------|-------------|
| `get` | Get the value of a Redis key |
| `set` | Set a key-value pair with optional TTL |
| `del` | Delete a Redis key |
| `keys` | List keys matching a glob pattern |
| `hget` | Get a field from a Redis hash |
| `hset` | Set a field in a Redis hash |
| `hgetall` | Get all fields from a Redis hash |
| `hdel` | Delete fields from a Redis hash |
| `publish` | Publish a message to a Redis channel |
| `info` | Get Redis server info and stats |
| `ping` | Ping the Redis server |

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `REDIS_URL` | *required* | Redis connection URL |
| `REDIS_KEY_PREFIX` | `""` | Prefix for all keys |
| `MCP_LOG_LEVEL` | `info` | Log level (debug/info/warn/error) |
| `MCP_TRANSPORT` | `stdio` | Transport (stdio/sse/streamable-http) |
| `MCP_PORT` | `3000` | Port for HTTP transports |

## Usage

```bash
# Direct run
REDIS_URL=redis://localhost:6379 npx @mcp-toolkit/redis

# In MCP config
{
  "mcpServers": {
    "redis": {
      "command": "npx",
      "args": ["@mcp-toolkit/redis"],
      "env": { "REDIS_URL": "redis://localhost:6379" }
    }
  }
}
```

## Programmatic API

```typescript
import { createServerContext, startServer } from "@mcp-toolkit/redis";

const ctx = createServerContext({ url: "redis://localhost:6379" });
await startServer(ctx);
```
