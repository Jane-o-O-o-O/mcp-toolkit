# 🔧 MCP Toolkit

[![npm version](https://img.shields.io/npm/v/mcp-toolkit.svg)](https://www.npmjs.com/package/mcp-toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> **Production-ready [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server collection** — connect your AI agents to databases, caches, and file systems with a single, unified toolkit.

## 📦 Packages

| Package | Description | Tools |
|---------|-------------|-------|
| `@mcp-toolkit/core` | Shared utilities — tool registration, error handling, config | — |
| `@mcp-toolkit/logger` | Structured logging with sensitive data redaction | — |
| `@mcp-toolkit/redis` | Redis cache, pub/sub, key management | 11 |
| `@mcp-toolkit/sqlite` | SQLite queries, schema inspection, data export | 5 |
| `@mcp-toolkit/postgres` | PostgreSQL queries, schema inspection, DDL | 6 |
| `@mcp-toolkit/filesystem` | File read/write/list/delete/search with security | 7 |

**Total: 29 tools across 4 servers**

## 🚀 Quick Start

```bash
# Install
npm install @mcp-toolkit/redis

# Run
REDIS_URL=redis://localhost:6379 npx @mcp-toolkit/redis
```

### MCP Client Config

```json
{
  "mcpServers": {
    "redis": {
      "command": "npx",
      "args": ["@mcp-toolkit/redis"],
      "env": { "REDIS_URL": "redis://localhost:6379" }
    },
    "postgres": {
      "command": "npx",
      "args": ["@mcp-toolkit/postgres"],
      "env": { "POSTGRES_URL": "postgresql://localhost/mydb" }
    },
    "sqlite": {
      "command": "npx",
      "args": ["@mcp-toolkit/sqlite"],
      "env": { "SQLITE_DB_PATH": "./data.db" }
    },
    "filesystem": {
      "command": "npx",
      "args": ["@mcp-toolkit/filesystem"],
      "env": { "MCP_FILESYSTEM_ROOT": "/home/user/projects" }
    }
  }
}
```

## 🏗️ Architecture

```
mcp-toolkit/
├── shared/
│   ├── core/          # Shared MCP server utilities
│   └── logger/        # Structured logging
├── packages/
│   ├── redis/         # Redis MCP Server
│   ├── sqlite/        # SQLite MCP Server
│   ├── postgres/      # PostgreSQL MCP Server
│   └── filesystem/    # Filesystem MCP Server
└── tsconfig.base.json
```

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test

# Build a specific package
cd packages/redis && pnpm build
```

## 📝 Environment Variables

All servers share these common variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_LOG_LEVEL` | `info` | Log level: debug, info, warn, error |
| `MCP_TRANSPORT` | `stdio` | Transport: stdio, sse, streamable-http |
| `MCP_PORT` | `3000` | Port for HTTP transports |

## 📄 License

MIT
