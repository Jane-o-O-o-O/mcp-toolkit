# @mcp-toolkit/prometheus

Prometheus MCP Server — query metrics, inspect targets, alerts, and recording rules via the Prometheus HTTP API.

## Tools (7)

| Tool | Description |
|------|-------------|
| `query` | Execute an instant PromQL query |
| `query_range` | Execute a range PromQL query over a time window |
| `targets` | List all scrape targets and their health state |
| `alerts` | List currently firing alerts |
| `rules` | List alerting and recording rules |
| `label_values` | Get all values for a given label name |
| `metadata` | Get HELP/TYPE metadata for metrics |

## Configuration

| Env Variable | Required | Default | Description |
|-------------|----------|---------|-------------|
| `PROMETHEUS_URL` | ✅ | — | Prometheus server URL |
| `PROMETHEUS_USERNAME` | ❌ | — | Username for basic auth |
| `PROMETHEUS_PASSWORD` | ❌ | — | Password for basic auth |
| `MCP_LOG_LEVEL` | ❌ | `info` | Log level: debug, info, warn, error |
| `MCP_TRANSPORT` | ❌ | `stdio` | Transport: stdio, sse, streamable-http |
| `MCP_PORT` | ❌ | `3000` | Port for HTTP transports |

## Usage

```bash
# stdio (default — for Claude Desktop, Cursor)
PROMETHEUS_URL=http://localhost:9090 npx @mcp-toolkit/prometheus

# HTTP mode
PROMETHEUS_URL=http://localhost:9090 MCP_TRANSPORT=streamable-http MCP_PORT=3005 npx @mcp-toolkit/prometheus
```

### Claude Desktop / Cursor 配置

```json
{
  "mcpServers": {
    "prometheus": {
      "command": "npx",
      "args": ["@mcp-toolkit/prometheus"],
      "env": {
        "PROMETHEUS_URL": "http://localhost:9090"
      }
    }
  }
}
```

### With basic auth

```json
{
  "mcpServers": {
    "prometheus": {
      "command": "npx",
      "args": ["@mcp-toolkit/prometheus"],
      "env": {
        "PROMETHEUS_URL": "https://prometheus.example.com",
        "PROMETHEUS_USERNAME": "admin",
        "PROMETHEUS_PASSWORD": "secret"
      }
    }
  }
}
```

## Dependencies

Uses native `fetch` (Node.js 20+) — no external HTTP client needed.
