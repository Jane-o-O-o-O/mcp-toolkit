# @mcp-toolkit/mysql

MySQL MCP Server — query, schema inspection, and data management.

## Tools

| Tool | Description |
|------|-------------|
| `query` | Execute SELECT queries with parameterized ? placeholders |
| `execute` | Execute write statements (INSERT/UPDATE/DELETE/CREATE/ALTER) |
| `list_tables` | List all tables with row count estimates |
| `describe_table` | Show column definitions for a table |
| `explain` | Run EXPLAIN on a SQL query |
| `show_databases` | List all available databases |

## Configuration

| Environment Variable | Required | Default | Description |
|---------------------|----------|---------|-------------|
| `MYSQL_URL` | Yes | — | MySQL connection string |
| `MCP_LOG_LEVEL` | No | `info` | Log level |
| `MCP_TRANSPORT` | No | `stdio` | Transport mode |

## Usage

```bash
# Direct run
MYSQL_URL=mysql://user:pass@localhost:3306/mydb npx @mcp-toolkit/mysql

# Claude Desktop config
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": ["@mcp-toolkit/mysql"],
      "env": { "MYSQL_URL": "mysql://user:pass@localhost:3306/mydb" }
    }
  }
}
```
