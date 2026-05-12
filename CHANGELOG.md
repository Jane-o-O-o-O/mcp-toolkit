# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-05-13

### Added
- **MySQL MCP Server** (`@mcp-toolkit/mysql`) — query, execute, list_tables, describe_table, explain, show_databases (6 tools)
- **MongoDB MCP Server** (`@mcp-toolkit/mongodb`) — find, findOne, insert, update, delete, aggregate, count, list databases/collections (12 tools)
- **HTTP Fetch MCP Server** (`@mcp-toolkit/fetch`) — http_get, http_post, http_put, http_delete, http_patch (5 tools)
- ESLint flat config with TypeScript rules
- CHANGELOG.md

### Changed
- Refactored postgres, filesystem, sqlite to use shared `safeRun`/`safeRunSync` from `@mcp-toolkit/core` (removed duplicated error handling)
- Updated root package.json with `"type": "module"` for proper ESM support

## [0.1.0] - 2026-05-12

### Added
- **Redis MCP Server** (`@mcp-toolkit/redis`) — get, set, del, keys, hget, hset, hgetall, hdel, publish, info, ping (11 tools)
- **SQLite MCP Server** (`@mcp-toolkit/sqlite`) — query, execute, list_tables, describe_table, export_table (5 tools)
- **PostgreSQL MCP Server** (`@mcp-toolkit/postgres`) — query, execute, list_tables, describe_table, explain (5 tools)
- **Docker MCP Server** (`@mcp-toolkit/docker`) — list/inspect/start/stop/remove containers, list images, logs (7 tools)
- **GitHub MCP Server** (`@mcp-toolkit/github`) — repos, issues, PRs, search (7 tools)
- **Filesystem MCP Server** (`@mcp-toolkit/filesystem`) — read/write/delete files, list/create directories, stat, move, grep, glob (10 tools)
- Shared core module (`@mcp-toolkit/core`) — tool registration, error handling, config validation, server lifecycle
- Shared logger module (`@mcp-toolkit/logger`) — structured logging with sensitive data masking
- Three transport modes: stdio, SSE, Streamable HTTP
- `/health` endpoint for HTTP transports
- Zod-based configuration validation for all servers
- pnpm workspace monorepo structure
- Vitest test suite with 172+ tests
- MIT License, CONTRIBUTING.md, CI workflow
