# @mcp-toolkit/grafana

Grafana MCP Server — manage dashboards, datasources, alert rules, annotations, and search Grafana from your AI agent.

## Tools (8)

| Tool | Description |
|------|-------------|
| `list_dashboards` | List all dashboards with title, tags, folder, last updated |
| `get_dashboard` | Get dashboard details — panels, templates, time range |
| `create_dashboard` | Create or update a dashboard with panels and tags |
| `list_datasources` | List configured datasources (Prometheus, Elasticsearch, etc.) |
| `query_datasource` | Query a datasource using its native language (PromQL, Lucene, SQL) |
| `list_alert_rules` | List alert rules with state, condition, folder |
| `create_annotation` | Create annotations (deployments, incidents, notes) |
| `search` | Search dashboards, folders, and panels by query |

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `GRAFANA_URL` | `http://localhost:3000` | Grafana instance URL |
| `GRAFANA_API_KEY` | — | Service account token (recommended) |
| `GRAFANA_USERNAME` | — | Basic auth username |
| `GRAFANA_PASSWORD` | — | Basic auth password |
| `MCP_LOG_LEVEL` | `info` | Log level |
| `MCP_TRANSPORT` | `stdio` | Transport: stdio, sse, streamable-http |
| `MCP_PORT` | `3000` | Port for HTTP transports |

> **Auth**: Use `GRAFANA_API_KEY` (service account token) for best security. Basic auth with `GRAFANA_USERNAME`/`GRAFANA_PASSWORD` is also supported.

## Quick Start

```bash
# Local Grafana
GRAFANA_URL=http://localhost:3000 GRAFANA_API_KEY=glsa_xxx npx @mcp-toolkit/grafana

# With basic auth
GRAFANA_URL=https://grafana.example.com GRAFANA_USERNAME=admin GRAFANA_PASSWORD=admin npx @mcp-toolkit/grafana

# HTTP mode
MCP_TRANSPORT=streamable-http MCP_PORT=3003 npx @mcp-toolkit/grafana
```

### Claude Desktop / Cursor

```json
{
  "mcpServers": {
    "grafana": {
      "command": "npx",
      "args": ["@mcp-toolkit/grafana"],
      "env": {
        "GRAFANA_URL": "http://localhost:3000",
        "GRAFANA_API_KEY": "glsa_xxx"
      }
    }
  }
}
```

## License

MIT
