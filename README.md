# 🔧 MCP Toolkit

[![npm version](https://img.shields.io/npm/v/mcp-toolkit.svg)](https://www.npmjs.com/package/mcp-toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> **Production-ready [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server collection** — connect your AI agents to databases, containers, code hosting, file systems, search engines, message queues, object storage, and monitoring systems with a single, unified toolkit.

## 📦 Packages

| Package | Description | Tools |
|---------|-------------|-------|
| `@mcp-toolkit/core` | Shared utilities — tool registration, error handling, config, transport | — |
| `@mcp-toolkit/logger` | Structured logging with sensitive data redaction | — |
| `@mcp-toolkit/redis` | Redis cache, pub/sub, key management | 11 |
| `@mcp-toolkit/sqlite` | SQLite queries, schema inspection, data export | 5 |
| `@mcp-toolkit/postgres` | PostgreSQL queries, schema inspection, DDL | 6 |
| `@mcp-toolkit/mysql` | MySQL queries, schema inspection, explain, database listing | 6 |
| `@mcp-toolkit/mongodb` | MongoDB CRUD, aggregation, collection/database management | 12 |
| `@mcp-toolkit/elasticsearch` | Elasticsearch search, indexing, cluster management | 11 |
| `@mcp-toolkit/fetch` | HTTP requests — GET, POST, PUT, DELETE, PATCH | 5 |
| `@mcp-toolkit/filesystem` | File read/write/list/delete with path security | 8 |
| `@mcp-toolkit/docker` | Docker container & image management | 7 |
| `@mcp-toolkit/github` | GitHub repos, issues, PRs via REST API | 7 |
| `@mcp-toolkit/s3` | S3/MinIO bucket & object storage operations | 8 |
| `@mcp-toolkit/kafka` | Kafka topic management, produce/consume, consumer groups | 8 |
| `@mcp-toolkit/prometheus` | Prometheus metrics query, targets, alerts, rules | 7 |
| `@mcp-toolkit/nats` | NATS pub/sub and JetStream message streaming | 7 |

**Total: 108 tools across 14 MCP servers**

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
    "mysql": {
      "command": "npx",
      "args": ["@mcp-toolkit/mysql"],
      "env": { "MYSQL_URL": "mysql://user:pass@localhost:3306/mydb" }
    },
    "mongodb": {
      "command": "npx",
      "args": ["@mcp-toolkit/mongodb"],
      "env": { "MONGODB_URL": "mongodb://localhost:27017/mydb" }
    },
    "elasticsearch": {
      "command": "npx",
      "args": ["@mcp-toolkit/elasticsearch"],
      "env": { "ELASTICSEARCH_URL": "http://localhost:9200" }
    },
    "fetch": {
      "command": "npx",
      "args": ["@mcp-toolkit/fetch"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["@mcp-toolkit/filesystem"],
      "env": { "FS_ROOT_DIR": "/home/user/projects" }
    },
    "s3": {
      "command": "npx",
      "args": ["@mcp-toolkit/s3"],
      "env": {
        "S3_ENDPOINT": "http://localhost:9000",
        "S3_ACCESS_KEY_ID": "minioadmin",
        "S3_SECRET_ACCESS_KEY": "minioadmin"
      }
    },
    "kafka": {
      "command": "npx",
      "args": ["@mcp-toolkit/kafka"],
      "env": { "KAFKA_BROKERS": "localhost:9092" }
    },
    "prometheus": {
      "command": "npx",
      "args": ["@mcp-toolkit/prometheus"],
      "env": { "PROMETHEUS_URL": "http://localhost:9090" }
    },
    "nats": {
      "command": "npx",
      "args": ["@mcp-toolkit/nats"],
      "env": { "NATS_URL": "nats://localhost:4222" }
    }
  }
}
```

## 🏗️ Architecture

```
mcp-toolkit/
├── shared/
│   ├── core/          # Tool registration, error handling, transport (stdio/SSE/HTTP)
│   ├── logger/        # Structured logging with redaction
│   └── mcp-base/      # Base MCP server utilities
├── packages/
│   ├── redis/         # Redis MCP Server (ioredis)
│   ├── sqlite/        # SQLite MCP Server (better-sqlite3)
│   ├── postgres/      # PostgreSQL MCP Server (pg)
│   ├── mysql/         # MySQL MCP Server (mysql2)
│   ├── mongodb/       # MongoDB CRUD & Aggregation (mongodb)
│   ├── elasticsearch/ # Elasticsearch search & indexing (@elastic/elasticsearch)
│   ├── fetch/         # HTTP Fetch MCP Server (native fetch)
│   ├── filesystem/    # Filesystem MCP Server (fs/promises)
│   ├── docker/        # Docker MCP Server (dockerode)
│   ├── github/        # GitHub MCP Server (REST API)
│   ├── s3/            # S3/MinIO MCP Server (@aws-sdk/client-s3)
│   ├── kafka/         # Kafka MCP Server (kafkajs)
│   ├── prometheus/    # Prometheus MCP Server (native fetch)
│   └── nats/          # NATS MCP Server (nats)
├── docker-compose.test.yml  # Integration test environment
├── docs/api/          # Auto-generated API docs (TypeDoc)
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

# Generate API docs
pnpm docs:api

# Lint
pnpm lint

# Integration tests (requires Docker)
docker compose -f docker-compose.test.yml up -d
bash scripts/test-integration.sh
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
