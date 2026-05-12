# @mcp-toolkit/filesystem

文件系统 MCP Server — 为 AI Agent 提供文件读写能力。

## 功能（8 个工具）

| 工具 | 描述 |
|------|------|
| `read_file` | 读取文件内容 |
| `write_file` | 写入文件（自动创建目录） |
| `list_dir` | 列出目录内容 |
| `stat` | 获取文件/目录信息 |
| `mkdir` | 创建目录 |
| `remove` | 删除文件/目录 |
| `copy` | 复制文件 |
| `move` | 移动/重命名文件 |

## 安装与使用

```bash
# 环境变量
export FS_ROOT_DIR="/path/to/project"
export FS_ALLOW_WRITE=true
export FS_ALLOW_DELETE=false

# stdio 模式
npx @mcp-toolkit/filesystem

# HTTP 模式
MCP_TRANSPORT=streamable-http MCP_PORT=3004 npx @mcp-toolkit/filesystem
```

## 配置

| 环境变量 | 默认值 | 描述 |
|----------|--------|------|
| `FS_ROOT_DIR` | 必填 | 根目录路径 |
| `FS_ALLOW_WRITE` | `true` | 允许写入 |
| `FS_ALLOW_DELETE` | `false` | 允许删除 |
| `FS_MAX_FILE_SIZE` | `10485760` | 最大文件大小（10MB） |
| `MCP_LOG_LEVEL` | `info` | 日志级别 |
| `MCP_TRANSPORT` | `stdio` | 传输模式 |

## Claude Desktop 配置

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@mcp-toolkit/filesystem"],
      "env": {
        "FS_ROOT_DIR": "/path/to/project"
      }
    }
  }
}
```
