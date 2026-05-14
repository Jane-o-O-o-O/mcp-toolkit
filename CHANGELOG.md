# Changelog

All notable changes to this project will be documented in this file.

## [0.6.0] - 2026-05-14

### Added
- **Kubernetes MCP Server** (`@mcp-toolkit/kubernetes`) — list_pods, get_pod, list_deployments, scale_deployment, list_services, get_logs, list_namespaces, describe_resource (8 tools)
- Supports kubeconfig, in-cluster auth (server + token), context selection
- 22 tests (14 tools + 8 config)
- **Grafana MCP Server** (`@mcp-toolkit/grafana`) — list_dashboards, get_dashboard, create_dashboard, list_datasources, query_datasource, list_alert_rules, create_annotation, search (8 tools)
- Supports API key auth and basic auth
- 22 tests (13 tools + 9 config)

### Changed
- Total tools: 108 → 124, servers: 14 → 16

## [0.5.0] - 2026-05-14

### Added
- **Prometheus MCP Server** (`@mcp-toolkit/prometheus`) — query, query_range, targets, alerts, rules, label_values, metadata (7 tools)
- Supports instant and range PromQL queries, scrape target monitoring, alerting rules inspection
- Basic auth support for secured Prometheus endpoints
- 22 tests (14 tools + 8 config)
- **NATS MCP Server** (`@mcp-toolkit/nats`) — publish, subscribe, jetstream_publish, jetstream_create_stream, jetstream_list_streams, jetstream_get_message, jetstream_delete_stream (7 tools)
- Supports core NATS pub/sub and JetStream persistent messaging
- Token and user/password authentication
- 20 tests (10 tools + 10 config)
- GitHub Actions CD workflow for automated npm publishing on tag push
- Version bump script (`scripts/bump-version.sh`) for monorepo releases

### Changed
- Total tools: 94 → 108, servers: 12 → 14

## [0.4.0] - 2026-05-13

### Added
- **S3/MinIO MCP Server** (`@mcp-toolkit/s3`) — list_buckets, create_bucket, delete_bucket, list_objects, get_object, put_object, delete_object, head_object (8 tools)
- Compatible with AWS S3, MinIO, and any S3-compatible service
- 29 tests (18 tools + 11 config)
- **Kafka MCP Server** (`@mcp-toolkit/kafka`) — list_topics, create_topic, delete_topic, produce_message, consume_messages, describe_topic, list_consumer_groups, describe_consumer_group (8 tools)
- Supports SASL auth (plain, scram-sha-256, scram-sha-512) and SSL
- 31 tests (18 tools + 13 config)
- Docker Compose integration test environment (`docker-compose.test.yml`)
- TypeDoc API documentation generation (`pnpm docs:api`)
- Integration test runner script (`scripts/test-integration.sh`)

### Changed
- Total tools: 78 → 94, servers: 10 → 12
- Updated main README with S3/Kafka packages, fixed JSON config formatting

## [0.3.0] - 2026-05-13

### Added
- **Elasticsearch MCP Server** (`@mcp-toolkit/elasticsearch`) — search, index_document, get_document, delete_document, bulk, list_indices, create_index, delete_index, index_mapping, count, cluster_health (11 tools)
- Supports API key auth (Elastic Cloud) and basic auth
- 30 tests (22 tools + 8 config)

### Fixed
- Fixed broken JSON in main README Claude Desktop configuration examples

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
