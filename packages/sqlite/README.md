# 🗄️ @mcp-toolkit/sqlite

SQLite MCP Server — query, schema inspection, and data management via the Model Context Protocol.

## Tools (5)

| Tool | Description |
|------|-------------|
| `query` | Execute a read-only SQL query (SELECT) |
| `execute` | Execute a write SQL statement (INSERT, UPDATE, DELETE, CREATE) |
| `list_tables` | List all user-created tables |
| `describe_table` | Get table schema, columns, and row count |
| `export_table` | Export table data as JSON with optional filtering |

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `SQLITE_DB_PATH` | *required* | Path to SQLite database file |
| `SQLITE_READONLY` | `false` | Open database in read-only mode |
| `MCP_LOG_LEVEL` | `info` | Log level (debug/info/warn/error) |
| `MCP_TRANSPORT` | `stdio` | Transport (stdio/sse/streamable-http) |
| `MCP_PORT` | `3000` | Port for HTTP transports |

## Usage

```bash
# Direct run
SQLITE_DB_PATH=/path/to/database.db npx @mcp-toolkit/sqlite

# In MCP config
{
  "mcpServers": {
    "sqlite": {
      "command": "npx",
      "args": ["@mcp-toolkit/sqlite"],
      "env": { "SQLITE_DB_PATH": "/path/to/database.db" }
    }
  }
}
```

## Programmatic API

```typescript
import { createServerContext, startServer } from "@mcp-toolkit/sqlite";

const ctx = createServerContext({ dbPath: "./data.db" });
await startServer(ctx);
```
