[**Documentation**](../../README.md)

***

[Documentation](../../README.md) / @mcp-toolkit/docker

# @mcp-toolkit/docker

Docker MCP Server — 为 AI Agent 提供 Docker 容器管理能力。

## 功能（7 个工具）

| 工具 | 描述 |
|------|------|
| `list_containers` | 列出容器 |
| `inspect_container` | 查看容器详情 |
| `container_logs` | 获取容器日志 |
| `start_container` | 启动容器 |
| `stop_container` | 停止容器 |
| `remove_container` | 删除容器 |
| `list_images` | 列出镜像 |

## 安装与使用

```bash
# 环境变量（可选）
export DOCKER_SOCKET="/var/run/docker.sock"

# stdio 模式
npx @mcp-toolkit/docker

# HTTP 模式
MCP_TRANSPORT=streamable-http MCP_PORT=3005 npx @mcp-toolkit/docker
```

## 配置

| 环境变量 | 默认值 | 描述 |
|----------|--------|------|
| `DOCKER_SOCKET` | `/var/run/docker.sock` | Docker socket 路径 |
| `DOCKER_HOST` | 无 | 远程 Docker 主机 |
| `DOCKER_PORT` | 无 | Docker 端口 |
| `MCP_LOG_LEVEL` | `info` | 日志级别 |
| `MCP_TRANSPORT` | `stdio` | 传输模式 |

## Claude Desktop 配置

```json
{
  "mcpServers": {
    "docker": {
      "command": "npx",
      "args": ["@mcp-toolkit/docker"]
    }
  }
}
```
