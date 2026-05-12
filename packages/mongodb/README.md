# @mcp-toolkit/mongodb

MongoDB MCP Server — CRUD, aggregation, and collection management.

## Tools

| Tool | Description |
|------|-------------|
| `list_databases` | List all databases on the server |
| `list_collections` | List collections in a database |
| `find` | Query documents with filter, sort, limit, projection |
| `find_one` | Find a single document |
| `insert_one` | Insert a single document |
| `insert_many` | Insert multiple documents |
| `update_one` | Update a single document (supports $set, $inc, etc.) |
| `update_many` | Update all matching documents |
| `delete_one` | Delete a single document |
| `delete_many` | Delete all matching documents |
| `count` | Count documents with optional filter |
| `aggregate` | Run an aggregation pipeline |

## Configuration

| Environment Variable | Required | Default | Description |
|---------------------|----------|---------|-------------|
| `MONGODB_URL` | Yes | — | MongoDB connection string |
| `MCP_LOG_LEVEL` | No | `info` | Log level |
| `MCP_TRANSPORT` | No | `stdio` | Transport mode |

## Usage

```bash
# Direct run
MONGODB_URL=mongodb://localhost:27017/mydb npx @mcp-toolkit/mongodb

# Claude Desktop config
{
  "mcpServers": {
    "mongodb": {
      "command": "npx",
      "args": ["@mcp-toolkit/mongodb"],
      "env": { "MONGODB_URL": "mongodb://localhost:27017/mydb" }
    }
  }
}
```
