# @mcp-toolkit/fetch

HTTP Fetch MCP Server — make HTTP requests, call APIs, scrape web pages.

## Tools

| Tool | Description |
|------|-------------|
| `http_get` | Make GET request with custom headers and timeout |
| `http_post` | Make POST request with body |
| `http_put` | Make PUT request |
| `http_delete` | Make DELETE request |
| `http_patch` | Make PATCH request |

## Features

- JSON response auto-parsing
- Large response truncation (5KB limit for non-JSON)
- Custom headers per request
- Configurable timeout (default 30s)
- No external dependencies (uses Node.js native `fetch`)

## Configuration

| Environment Variable | Required | Default | Description |
|---------------------|----------|---------|-------------|
| `FETCH_TIMEOUT` | No | `30000` | Default request timeout (ms) |
| `FETCH_MAX_SIZE` | No | `1000000` | Max response size (bytes) |
| `FETCH_DEFAULT_HEADERS` | No | `{}` | Default headers as JSON |

## Usage

```bash
# Direct run
npx @mcp-toolkit/fetch

# With custom timeout
FETCH_TIMEOUT=10000 npx @mcp-toolkit/fetch

# Claude Desktop config
{
  "mcpServers": {
    "fetch": {
      "command": "npx",
      "args": ["@mcp-toolkit/fetch"]
    }
  }
}
```
