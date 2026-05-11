# 🔧 @mcp-toolkit/core

Shared core utilities for MCP Toolkit servers — tool registration, error handling, config loading, and server lifecycle.

## Exports

### Tools
- `textResult(text)` — Create a success text result
- `jsonResult(data)` — Create a JSON-serialized result
- `errorResult(message)` — Create an error result
- `safeRun(fn, format?)` — Wrap async operations with error handling
- `safeRunSync(fn, format?)` — Wrap sync operations with error handling

### Types
- `McpTool` — Complete tool with definition + handler
- `ToolDefinition` — MCP tool schema
- `ToolResult` — Tool execution result

### Server
- `createMcpServer(name, version, tools, logger)` — Create MCP server with auto-registered tools
- `startStdioServer(server, logger, name)` — Start server with stdio transport

### Config
- `BaseConfigFields` — Zod schema fields shared by all servers (logLevel, transport, port)
- `parseBaseEnvVars()` — Parse common env vars into base config
- `BaseServerConfig` — TypeScript interface for base config

## Usage

```typescript
import {
  createMcpServer,
  startStdioServer,
  safeRun,
  textResult,
  errorResult,
  BaseConfigFields,
  parseBaseEnvVars,
} from "@mcp-toolkit/core";
```
