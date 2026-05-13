[**Documentation**](../../README.md)

***

[Documentation](../../README.md) / @mcp-toolkit/github

# @mcp-toolkit/github

GitHub MCP Server — 为 AI Agent 提供 GitHub 仓库管理能力。

## 功能（7 个工具）

| 工具 | 描述 |
|------|------|
| `list_repos` | 列出仓库 |
| `get_repo` | 获取仓库详情 |
| `list_issues` | 列出 Issues |
| `get_issue` | 获取 Issue 详情 |
| `create_issue` | 创建 Issue |
| `list_pull_requests` | 列出 PRs |
| `search_repos` | 搜索仓库 |

## 安装与使用

```bash
# 环境变量
export GITHUB_TOKEN="ghp_your_token_here"

# stdio 模式
npx @mcp-toolkit/github

# HTTP 模式
MCP_TRANSPORT=streamable-http MCP_PORT=3006 npx @mcp-toolkit/github
```

## 配置

| 环境变量 | 默认值 | 描述 |
|----------|--------|------|
| `GITHUB_TOKEN` | 必填 | GitHub Personal Access Token |
| `GITHUB_API_URL` | `https://api.github.com` | API URL（支持 GitHub Enterprise） |
| `MCP_LOG_LEVEL` | `info` | 日志级别 |
| `MCP_TRANSPORT` | `stdio` | 传输模式 |

## Claude Desktop 配置

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["@mcp-toolkit/github"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```
