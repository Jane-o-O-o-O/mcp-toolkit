# 🐘 @mcp-toolkit/postgres

PostgreSQL MCP Server — query, schema inspection, and database management via the Model Context Protocol.

## Tools (6)

| Tool | Description |
|------|-------------|
| `query` | Execute a read-only SQL query with parameterized values |
| `execute` | Execute a write SQL statement (INSERT, UPDATE, DELETE, DDL) |
| `list_tables` | List tables in a schema (default: public) |
| `describe_table` | Get column details — type, nullable, defaults, constraints |
| `list_schemas` | List all schemas in the database |
| `database_info` | Get server version, current database, and connection info |

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `POSTGRES_URL` | *required* | PostgreSQL connection string (also accepts `DATABASE_URL`) |
| `POSTGRES_MAX_CONNECTIONS` | `10` | Connection pool max size |
| `POSTGRES_QUERY_TIMEOUT` | `30000` | Query timeout in milliseconds |
| `MCP_LOG_LEVEL` | `info` | Log level (debug/info/warn/error) |
| `MCP_TRANSPORT` | `stdio` | Transport (stdio/sse/streamable-http) |
| `MCP_PORT` | `3000` | Port for HTTP transports |

## Usage

```bash
# Direct run
POSTGRES_URL=postgresql://user:pass@localhost:5432/mydb npx @mcp-toolkit/postgres

# In MCP config
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["@mcp-toolkit/postgres"],
      "env": { "POSTGRES_URL": "postgresql://user:pass@localhost:5432/mydb" }
    }
  }
}
```

## Programmatic API

```typescript
import { createServerContext, startServer } from "@mcp-toolkit/postgres";

const ctx = createServerContext({
  connectionString: "postgresql://localhost/mydb",
  maxConnections: 20,
});
await startServer(ctx);
```

## Security Notes

- Use parameterized queries (`$1`, `$2`) to prevent SQL injection
- The `query` tool is for SELECT statements; use `execute` for writes
- Set appropriate `POSTGRES_MAX_CONNECTIONS` for your workload
