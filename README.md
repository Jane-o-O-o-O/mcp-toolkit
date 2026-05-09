# 🔧 MCP Toolkit

[![npm version](https://img.shields.io/npm/v/mcp-toolkit.svg)](https://www.npmjs.com/package/mcp-toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MCP SDK](https://img.shields.io/badge/MCP_SDK-v1.x-000000.svg)](https://github.com/modelcontextprotocol/sdk)
[![CI](https://github.com/mcp-toolkit/mcp-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/mcp-toolkit/mcp-toolkit/actions)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED.svg?logo=docker&logoColor=white)](https://hub.docker.com/r/mcptoolkit)

> **Production-ready [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server collection** — connect your AI agents and LLM-powered applications to databases, caches, containers, CI/CD pipelines, and monitoring systems with a single, unified toolkit.

MCP Toolkit provides a curated set of high-quality MCP servers built with **TypeScript** and the official **MCP SDK**. Each server is independently deployable, fully typed, and battle-tested for production workloads.

---

## 📦 Servers

| Server | Package | Description | Tools |
|--------|---------|-------------|-------|
| 🗄️ **Database** | `@mcp-toolkit/database` | Query & manage PostgreSQL, MySQL, SQLite | `query`, `list_tables`, `describe_table`, `explain`, `migrate` |
| 🔴 **Redis** | `@mcp-toolkit/redis` | Cache ops, pub/sub, key management | `get`, `set`, `del`, `keys`, `hget`, `hset`, `publish`, `info` |
| 🐳 **Docker** | `@mcp-toolkit/docker` | Container & image lifecycle management | `list_containers`, `run`, `stop`, `remove`, `logs`, `build`, `inspect` |
| 🚀 **CI/CD** | `@mcp-toolkit/cicd` | GitHub Actions, GitLab CI, Jenkins triggers | `list_workflows`, `trigger_run`, `get_status`, `get_logs`, `list_artifacts` |
| 📊 **Monitoring** | `@mcp-toolkit/monitoring` | Prometheus, Grafana, Datadog integration | `query_metrics`, `list_alerts`, `get_dashboard`, `create_annotation` |

### Server Highlights

- **Database** — Parameterized queries, schema introspection, migration support, connection pooling
- **Redis** — Full data structure support (strings, hashes, lists, sets, sorted sets), TTL management, pipeline operations
- **Docker** — Compose-aware, multi-container orchestration, log streaming, health checks
- **CI/CD** — Multi-platform support, artifact download, workflow visualization, branch-aware triggers
- **Monitoring** — PromQL & Grafana queries, alert acknowledgment, metric export, dashboard snapshots

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10 or **pnpm** ≥ 9

### 1. Install

```bash
# Install all servers
npm install @mcp-toolkit/database @mcp-toolkit/redis @mcp-toolkit/docker @mcp-toolkit/cicd @mcp-toolkit/monitoring

# Or install individually
npm install @mcp-toolkit/database
```

### 2. Configure

Create a `mcp-config.json` at your project root:

```json
{
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["@mcp-toolkit/database"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/mydb"
      }
    },
    "redis": {
      "command": "npx",
      "args": ["@mcp-toolkit/redis"],
      "env": {
        "REDIS_URL": "redis://localhost:6379"
      }
    },
    "docker": {
      "command": "npx",
      "args": ["@mcp-toolkit/docker"],
      "env": {
        "DOCKER_HOST": "unix:///var/run/docker.sock"
      }
    }
  }
}
```

### 3. Run

```bash
# Start a single server
npx @mcp-toolkit/database

# Start all configured servers (with MCP Inspector for debugging)
npx @modelcontextprotocol/inspector mcp-config.json
```

### 4. Connect from your AI application

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "npx",
  args: ["@mcp-toolkit/database"],
  env: { DATABASE_URL: "postgresql://user:pass@localhost:5432/mydb" },
});

const client = new Client({ name: "my-app", version: "1.0.0" });
await client.connect(transport);

// List available tools
const { tools } = await client.listTools();
console.log(tools.map((t) => t.name));

// Execute a query
const result = await client.callTool({
  name: "query",
  arguments: { sql: "SELECT * FROM users LIMIT 10" },
});
console.log(result);
```

---

## ⚙️ Configuration

### Environment Variables

Each server is configured via environment variables. All servers share a common prefix pattern:

| Variable | Servers | Required | Description |
|----------|---------|----------|-------------|
| `MCP_LOG_LEVEL` | All | No | Logging level: `debug`, `info`, `warn`, `error` (default: `info`) |
| `MCP_TRANSPORT` | All | No | Transport type: `stdio`, `sse`, `streamable-http` (default: `stdio`) |
| `MCP_PORT` | All (SSE/HTTP) | No | Port for SSE/HTTP transport (default: `3000`) |
| `DATABASE_URL` | Database | Yes | Connection string (Postgres, MySQL, SQLite) |
| `DATABASE_POOL_SIZE` | Database | No | Max connections (default: `10`) |
| `DATABASE_READONLY` | Database | No | Enforce read-only mode (`true`/`false`) |
| `REDIS_URL` | Redis | Yes | Redis connection URL |
| `REDIS_KEY_PREFIX` | Redis | No | Prefix for all key operations |
| `DOCKER_HOST` | Docker | No | Docker daemon socket (default: system) |
| `DOCKER_TLS_VERIFY` | Docker | No | Enable TLS verification |
| `CICD_PLATFORM` | CI/CD | Yes | `github`, `gitlab`, or `jenkins` |
| `CICD_TOKEN` | CI/CD | Yes | API token for the CI/CD platform |
| `CICD_REPO` | CI/CD | Yes | Repository identifier (`owner/repo`) |
| `MONITORING_PROVIDER` | Monitoring | Yes | `prometheus`, `grafana`, or `datadog` |
| `MONITORING_URL` | Monitoring | Yes | Provider API endpoint |
| `MONITORING_API_KEY` | Monitoring | Yes | API key / token |

### Full Configuration Example

```json
{
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["@mcp-toolkit/database"],
      "env": {
        "DATABASE_URL": "postgresql://admin:secret@db.internal:5432/production",
        "DATABASE_POOL_SIZE": "20",
        "DATABASE_READONLY": "true",
        "MCP_LOG_LEVEL": "warn"
      }
    },
    "redis": {
      "command": "npx",
      "args": ["@mcp-toolkit/redis"],
      "env": {
        "REDIS_URL": "redis://:password@cache.internal:6379/0",
        "REDIS_KEY_PREFIX": "app:prod:",
        "MCP_LOG_LEVEL": "info"
      }
    },
    "docker": {
      "command": "npx",
      "args": ["@mcp-toolkit/docker"],
      "env": {
        "DOCKER_HOST": "tcp://docker.internal:2376",
        "DOCKER_TLS_VERIFY": "1",
        "DOCKER_CERT_PATH": "/certs"
      }
    },
    "cicd": {
      "command": "npx",
      "args": ["@mcp-toolkit/cicd"],
      "env": {
        "CICD_PLATFORM": "github",
        "CICD_TOKEN": "ghp_xxxxxxxxxxxx",
        "CICD_REPO": "my-org/my-repo"
      }
    },
    "monitoring": {
      "command": "npx",
      "args": ["@mcp-toolkit/monitoring"],
      "env": {
        "MONITORING_PROVIDER": "grafana",
        "MONITORING_URL": "https://grafana.internal/api",
        "MONITORING_API_KEY": "glax_xxxxxxxxxxxx"
      }
    }
  }
}
```

### SSE / HTTP Transport

For remote or multi-client setups, run any server over SSE or Streamable HTTP:

```bash
# SSE transport
MCP_TRANSPORT=sse MCP_PORT=8080 npx @mcp-toolkit/database

# Streamable HTTP transport
MCP_TRANSPORT=streamable-http MCP_PORT=8080 npx @mcp-toolkit/database
```

```typescript
// Connect via SSE
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const transport = new SSEClientTransport(new URL("http://localhost:8080/sse"));
await client.connect(transport);
```

---

## 🏗️ Architecture

```
mcp-toolkit/
├── packages/
│   ├── database/       # 🗄️ Database MCP Server
│   ├── redis/          # 🔴 Redis MCP Server
│   ├── docker/         # 🐳 Docker MCP Server
│   ├── cicd/           # 🚀 CI/CD MCP Server
│   └── monitoring/     # 📊 Monitoring MCP Server
├── shared/
│   ├── logger/         # Structured logging utilities
│   ├── transport/      # Shared transport helpers
│   └── validation/     # Input validation schemas
├── examples/           # Integration examples
└── docs/               # Extended documentation
```

Each server follows a consistent internal pattern:

```
packages/<server>/
├── src/
│   ├── index.ts        # Entry point & server bootstrap
│   ├── tools/          # Tool definitions & handlers
│   ├── resources/      # Resource providers
│   ├── prompts/        # Prompt templates
│   └── utils/          # Server-specific utilities
├── tests/
├── package.json
└── tsconfig.json
```

---

## 🧑‍💻 Development

```bash
# Clone the repository
git clone https://github.com/mcp-toolkit/mcp-toolkit.git
cd mcp-toolkit

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint & format
pnpm lint
pnpm format

# Run a single server in dev mode
pnpm --filter @mcp-toolkit/database dev
```

### Adding a New Server

```bash
# Scaffold a new server package
pnpm create-server my-server

# Or manually: copy an existing package, update package.json, and implement tools
```

---

## 🐳 Docker

Run any server in a container:

```bash
docker run -e DATABASE_URL="postgresql://..." ghcr.io/mcp-toolkit/database:latest
```

Or use Docker Compose for the full stack:

```yaml
# docker-compose.yml
version: "3.9"
services:
  database-server:
    image: ghcr.io/mcp-toolkit/database:latest
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/mydb
      MCP_TRANSPORT: sse
      MCP_PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      - db

  redis-server:
    image: ghcr.io/mcp-toolkit/redis:latest
    environment:
      REDIS_URL: redis://redis:6379
      MCP_TRANSPORT: sse
      MCP_PORT: 3002
    ports:
      - "3002:3002"
    depends_on:
      - redis

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb

  redis:
    image: redis:7-alpine
```

---

## 📖 Usage Examples

### Database — Schema Exploration

```typescript
// List all tables
const tables = await client.callTool({ name: "list_tables", arguments: {} });

// Describe a specific table
const schema = await client.callTool({
  name: "describe_table",
  arguments: { table: "users" },
});

// Run a parameterized query
const users = await client.callTool({
  name: "query",
  arguments: {
    sql: "SELECT id, name, email FROM users WHERE created_at > $1",
    params: ["2024-01-01"],
  },
});
```

### Redis — Cache Operations

```typescript
await client.callTool({ name: "set", arguments: { key: "user:1", value: '{"name":"Alice"}', ttl: 3600 } });
const user = await client.callTool({ name: "get", arguments: { key: "user:1" } });
await client.callTool({ name: "publish", arguments: { channel: "events", message: "user.updated" } });
```

### Docker — Container Management

```typescript
const containers = await client.callTool({ name: "list_containers", arguments: { all: true } });
const logs = await client.callTool({ name: "logs", arguments: { container: "my-app", tail: 50 } });
await client.callTool({ name: "run", arguments: { image: "nginx:latest", ports: { "80": "8080" } } });
```

---

## 🔒 Security

- **Read-only mode** — Database server supports `DATABASE_READONLY=true` to block write operations
- **Input validation** — All tool inputs are validated with Zod schemas before execution
- **Parameterized queries** — SQL injection prevention via parameterized queries (no string interpolation)
- **Token scoping** — CI/CD server respects GitHub/GitLab fine-grained token permissions
- **No secrets in logs** — Sensitive values are automatically redacted from logs and responses
- **Rate limiting** — Built-in rate limiter to prevent abuse in SSE/HTTP modes

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit with [Conventional Commits](https://www.conventionalcommits.org/)
4. Open a Pull Request

---

## 📄 License

[MIT](LICENSE) © MCP Toolkit Contributors

---

<p align="center">
  Built with ❤️ using the <a href="https://github.com/modelcontextprotocol/sdk">Model Context Protocol SDK</a>
</p>