[**Documentation**](../../README.md)

***

[Documentation](../../README.md) / @mcp-toolkit/postgres

# @mcp-toolkit/postgres

PostgreSQL MCP Server — 为 AI Agent 提供 PostgreSQL 数据库操作能力。

## 功能（6 个工具）

| 工具 | 描述 |
|------|------|
| `query` | 执行只读 SQL 查询 |
| `execute` | 执行写入 SQL |
| `list_tables` | 列出所有表 |
| `describe_table` | 查看表结构（列、类型、约束） |
| `list_schemas` | 列出所有 schema |
| `database_info` | 获取数据库版本和连接信息 |

## 安装与使用

```bash
# 环境变量
export PG_CONNECTION_STRING="postgresql://user:pass@localhost:5432/mydb"

# stdio 模式
npx @mcp-toolkit/postgres

# HTTP 模式
MCP_TRANSPORT=streamable-http MCP_PORT=3003 npx @mcp-toolkit/postgres
```

## 配置

| 环境变量 | 默认值 | 描述 |
|----------|--------|------|
| `PG_CONNECTION_STRING` | 必填 | PostgreSQL 连接字符串 |
| `PG_MAX_CONNECTIONS` | `10` | 最大连接数 |
| `PG_QUERY_TIMEOUT` | `30000` | 查询超时（毫秒） |
| `MCP_LOG_LEVEL` | `info` | 日志级别 |
| `MCP_TRANSPORT` | `stdio` | 传输模式 |

## Claude Desktop 配置

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["@mcp-toolkit/postgres"],
      "env": {
        "PG_CONNECTION_STRING": "postgresql://user:pass@localhost:5432/mydb"
      }
    }
  }
}
```
