# 🔧 MCP Toolkit

[![npm version](https://img.shields.io/npm/v/mcp-toolkit.svg)](https://www.npmjs.com/package/mcp-toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> **Production-ready [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server collection** — connect your AI agents to databases, containers, code hosting, and file systems with a single, unified toolkit.

## 📦 Packages

| Package | Description | Tools |
|---------|-------------|-------|
| `@mcp-toolkit/core` | Shared utilities — tool registration, error handling, config, transport | — |
| `@mcp-toolkit/logger` | Structured logging with sensitive data redaction | — |
| `@mcp-toolkit/redis` | Redis cache, pub/sub, key management | 11 |
| `@mcp-toolkit/sqlite` | SQLite queries, schema inspection, data export | 5 |
| `@mcp-toolkit/postgres` | PostgreSQL queries, schema inspection, DDL | 6 |
| `@mcp-toolkit/filesystem` | File read/write/list/delete with path security | 8 |
| `@mcp-toolkit/docker` | Docker container & image management | 7 |
| `@mcp-toolkit/github` | GitHub repos, issues, PRs via REST API | 7 |

**Total: 44 tools across 6 MCP servers**

## 🚀 Quick Start

```bash
# Install any server
npx @mcp-toolkit/redis

# With environment variables
REDIS_URL=redis://localhost:6379 npx @mcp-toolkit/redis

# HTTP mode (for remote access)
MCP_TRANSPORT=streamable-http MCP_PORT=3001 npx @mcp-toolkit/redis
```

### Claude Desktop / Cursor 配置

```json
{
  "mcpServers": {
    "redis": {
      "command": "npx",
      "args": ["@mcp-toolkit/redis"],
      "env": { "REDIS_URL": "redis://localhost:6379" }
    },
    "sqlite": {
      "command": "npx",
      "args": ["@mcp-toolkit/sqlite"],
      "env": { "SQLITE_DB_PATH": "./data.db" }
    },
    "postgres": {
      "command": "npx",
      "args": ["@mcp-toolkit/postgres"],
      "env": { "PG_CONNECTION_STRING": "postgresql://localhost/mydb" }
    },
    "github": {
      "command": "npx",
      "args": ["@mcp-toolkit/github"],
      "env": { "GITHUB_TOKEN": "ghp_xxx" }
    },
    "docker": {
      "command": "npx",
      "args": ["@mcp-toolkit/docker"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["@mcp-toolkit/filesystem"],
      "env": { "FS_ROOT_DIR": "/home/user/projects" }
    }
  }
}
```

## 🏗️ Architecture

```
mcp-toolkit/
├── shared/
│   ├── core/          # Tool registration, error handling, transport (stdio/SSE/HTTP)
│   └── logger/        # Structured logging with redaction
├── packages/
│   ├── redis/         # Redis MCP Server (ioredis)
│   ├── sqlite/        # SQLite MCP Server (better-sqlite3)
│   ├── postgres/      # PostgreSQL MCP Server (pg)
│   ├── filesystem/    # Filesystem MCP Server (fs/promises)
│   ├── docker/        # Docker MCP Server (dockerode)
│   └── github/        # GitHub MCP Server (REST API)
└── tsconfig.base.json
```

## 🔌 Transport Modes

All servers support 3 transport modes via `MCP_TRANSPORT`:

| Mode | Use Case |
|------|----------|
| `stdio` | Default. For MCP clients like Claude Desktop, Cursor |
| `streamable-http` | HTTP API with SSE streaming. For remote/web access |
| `sse` | Legacy SSE transport (deprecated by MCP spec) |

```bash
# stdio (default — for Claude Desktop)
npx @mcp-toolkit/redis

# HTTP mode (for remote access)
MCP_TRANSPORT=streamable-http MCP_PORT=3001 npx @mcp-toolkit/redis

# Health check
curl http://localhost:3001/health
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

## 📝 Common Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_LOG_LEVEL` | `info` | Log level: debug, info, warn, error |
| `MCP_TRANSPORT` | `stdio` | Transport: stdio, sse, streamable-http |
| `MCP_PORT` | `3000` | Port for HTTP transports |

Each server has its own environment variables — see individual README files in `packages/*/README.md`.

## 📄 License

MIT
