# 📁 @mcp-toolkit/filesystem

Filesystem MCP Server — read, write, list, delete, and search files and directories via the Model Context Protocol.

## Tools (7)

| Tool | Description |
|------|-------------|
| `read_file` | Read a text file's contents |
| `write_file` | Write content to a file (creates parents) |
| `list_directory` | List files/directories, supports recursive mode |
| `stat` | Get file metadata (size, timestamps, type, permissions) |
| `mkdir` | Create a directory (with parents) |
| `delete` | Delete a file or directory (requires `MCP_FILESYSTEM_ALLOW_DELETE=true`) |
| `search_files` | Search files matching a glob pattern |

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `MCP_FILESYSTEM_ROOT` | *required* | Root directory for all operations |
| `MCP_FILESYSTEM_ALLOW_WRITE` | `true` | Allow write/mkdir operations |
| `MCP_FILESYSTEM_ALLOW_DELETE` | `false` | Allow delete operations |
| `MCP_FILESYSTEM_MAX_FILE_SIZE` | `10485760` | Max file size for reads (bytes, default 10MB) |
| `MCP_LOG_LEVEL` | `info` | Log level (debug/info/warn/error) |
| `MCP_TRANSPORT` | `stdio` | Transport (stdio/sse/streamable-http) |
| `MCP_PORT` | `3000` | Port for HTTP transports |

## Security

- **Path traversal protection** — all paths are validated to stay within `MCP_FILESYSTEM_ROOT`
- **Write disabled by default** — set `MCP_FILESYSTEM_ALLOW_WRITE=true` to enable
- **Delete disabled by default** — set `MCP_FILESYSTEM_ALLOW_DELETE=true` to enable
- **File size limits** — reads are capped at `MCP_FILESYSTEM_MAX_FILE_SIZE`

## Usage

```bash
# Read-only access
MCP_FILESYSTEM_ROOT=/home/user/projects npx @mcp-toolkit/filesystem

# Full access with delete
MCP_FILESYSTEM_ROOT=/home/user/projects \
MCP_FILESYSTEM_ALLOW_WRITE=true \
MCP_FILESYSTEM_ALLOW_DELETE=true \
npx @mcp-toolkit/filesystem

# In MCP config
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@mcp-toolkit/filesystem"],
      "env": {
        "MCP_FILESYSTEM_ROOT": "/home/user/projects",
        "MCP_FILESYSTEM_ALLOW_WRITE": "true"
      }
    }
  }
}
```

## Programmatic API

```typescript
import { createServerContext, startServer } from "@mcp-toolkit/filesystem";

const ctx = createServerContext({
  rootDir: "/home/user/projects",
  allowWrite: true,
  allowDelete: false,
});
await startServer(ctx);
```
