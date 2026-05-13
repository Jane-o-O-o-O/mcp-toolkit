# @mcp-toolkit/s3

S3/MinIO MCP Server — bucket & object storage operations, compatible with AWS S3, MinIO, and any S3-compatible service.

## Tools

| Tool | Description |
|------|-------------|
| `list_buckets` | List all S3 buckets |
| `create_bucket` | Create a new bucket |
| `delete_bucket` | Delete an empty bucket |
| `list_objects` | List objects with optional prefix filter |
| `get_object` | Get object content as text |
| `put_object` | Upload content to an object |
| `delete_object` | Delete an object |
| `head_object` | Get object metadata without content |

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `S3_ENDPOINT` | (none) | Custom endpoint for MinIO/localstack |
| `S3_REGION` | `us-east-1` | AWS region |
| `S3_ACCESS_KEY_ID` | **required** | Access key |
| `S3_SECRET_ACCESS_KEY` | **required** | Secret key |
| `S3_FORCE_PATH_STYLE` | `true` | Use path-style URLs (required for MinIO) |
| `MCP_LOG_LEVEL` | `info` | Log level |
| `MCP_TRANSPORT` | `stdio` | Transport: `stdio`, `sse`, `streamable-http` |
| `MCP_PORT` | `3000` | HTTP port (for sse/streamable-http) |

## Claude Desktop Configuration

### AWS S3
```json
{
  "mcpServers": {
    "s3": {
      "command": "npx",
      "args": ["@mcp-toolkit/s3"],
      "env": {
        "S3_ACCESS_KEY_ID": "AKIAIOSFODNN7EXAMPLE",
        "S3_SECRET_ACCESS_KEY": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "S3_REGION": "us-east-1"
      }
    }
  }
}
```

### MinIO (local)
```json
{
  "mcpServers": {
    "s3": {
      "command": "npx",
      "args": ["@mcp-toolkit/s3"],
      "env": {
        "S3_ENDPOINT": "http://localhost:9000",
        "S3_ACCESS_KEY_ID": "minioadmin",
        "S3_SECRET_ACCESS_KEY": "minioadmin",
        "S3_FORCE_PATH_STYLE": "true"
      }
    }
  }
}
```
