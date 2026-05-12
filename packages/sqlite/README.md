# @mcp-toolkit/sqlite

SQLite MCP Server — 为 AI Agent 提供 SQLite 数据库操作能力。

## 功能（7 个工具）

| 工具 | 描述 |
|------|------|
| `query` | 执行只读 SQL 查询 |
| `execute` | 执行写入 SQL（INSERT/UPDATE/DELETE/CREATE） |
| `list_tables` | 列出所有表 |
| `describe_table` | 查看表结构 |
| `export_table` | 导出表数据为 CSV/JSON |
| `vacuum` | 压缩数据库 |
| `database_info` | 获取数据库信息 |

## 安装与使用

```bash
# 环境变量
export SQLITE_DB_PATH="/path/to/database.db"
export SQLITE_READONLY=false  # 可选

# stdio 模式
npx @mcp-toolkit/sqlite

# HTTP 模式
MCP_TRANSPORT=streamable-http MCP_PORT=3002 npx @mcp-toolkit/sqlite
```

## 配置

| 环境变量 | 默认值 | 描述 |
|----------|--------|------|
| `SQLITE_DB_PATH` | 必填 | 数据库文件路径 |
| `SQLITE_READONLY` | `false` | 只读模式 |
| `MCP_LOG_LEVEL` | `info` | 日志级别 |
| `MCP_TRANSPORT` | `stdio` | 传输模式 |

## Claude Desktop 配置

```json
{
  "mcpServers": {
    "sqlite": {
      "command": "npx",
      "args": ["@mcp-toolkit/sqlite"],
      "env": {
        "SQLITE_DB_PATH": "/path/to/database.db"
      }
    }
  }
}
```
