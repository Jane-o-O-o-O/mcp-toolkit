# @mcp-toolkit/redis

Redis MCP Server — 为 AI Agent 提供 Redis 数据库操作能力。

## 功能（11 个工具）

| 工具 | 描述 |
|------|------|
| `get` | 获取 key 的值 |
| `set` | 设置 key-value（支持过期时间） |
| `del` | 删除 key |
| `keys` | 按 pattern 搜索 keys |
| `hget` | 获取 hash 字段值 |
| `hset` | 设置 hash 字段 |
| `hgetall` | 获取 hash 所有字段 |
| `hdel` | 删除 hash 字段 |
| `publish` | 发布消息到 channel |
| `info` | 获取 Redis 服务器信息 |
| `ping` | 测试连接 |

## 安装与使用

```bash
# 环境变量
export REDIS_URL="redis://localhost:6379"
export REDIS_KEY_PREFIX="myapp:"  # 可选

# 作为 MCP Server 启动（stdio 模式）
npx @mcp-toolkit/redis

# HTTP 模式
MCP_TRANSPORT=streamable-http MCP_PORT=3001 npx @mcp-toolkit/redis
```

## 配置

| 环境变量 | 默认值 | 描述 |
|----------|--------|------|
| `REDIS_URL` | 必填 | Redis 连接 URL |
| `REDIS_KEY_PREFIX` | `""` | key 前缀 |
| `MCP_LOG_LEVEL` | `info` | 日志级别 |
| `MCP_TRANSPORT` | `stdio` | 传输模式（stdio/sse/streamable-http） |
| `MCP_PORT` | `3000` | HTTP 端口 |

## Claude Desktop 配置

```json
{
  "mcpServers": {
    "redis": {
      "command": "npx",
      "args": ["@mcp-toolkit/redis"],
      "env": {
        "REDIS_URL": "redis://localhost:6379"
      }
    }
  }
}
```
