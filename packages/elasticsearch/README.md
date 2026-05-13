# @mcp-toolkit/elasticsearch

Elasticsearch MCP Server — 为 AI Agent 提供 Elasticsearch 搜索和文档管理能力。

## Tools

| Tool | Description |
|------|-------------|
| `search` | Search documents using Query DSL with pagination and sorting |
| `index_document` | Index (create/update) a document |
| `get_document` | Get a document by ID |
| `delete_document` | Delete a document by ID |
| `bulk` | Execute bulk index/update/delete operations |
| `list_indices` | List all indices with document counts and sizes |
| `create_index` | Create an index with optional mappings and settings |
| `delete_index` | Delete an index (⚠️ destroys all data) |
| `index_mapping` | Get the mapping (schema) of an index |
| `count` | Count documents with optional query filter |
| `cluster_health` | Get cluster health status (green/yellow/red) |

## Configuration

| Environment Variable | Required | Default | Description |
|---------------------|----------|---------|-------------|
| `ELASTICSEARCH_URL` | Yes | — | Elasticsearch URL (e.g. `http://localhost:9200`) |
| `ELASTICSEARCH_API_KEY` | No | — | API key auth (recommended for cloud) |
| `ELASTICSEARCH_USERNAME` | No | — | Basic auth username |
| `ELASTICSEARCH_PASSWORD` | No | — | Basic auth password |
| `MCP_LOG_LEVEL` | No | `info` | Log level |
| `MCP_TRANSPORT` | No | `stdio` | Transport mode |

## Usage

```bash
# Direct run
ELASTICSEARCH_URL=http://localhost:9200 npx @mcp-toolkit/elasticsearch

# With API key (Elastic Cloud)
ELASTICSEARCH_URL=https://my-deployment.es.io:9243 ELASTICSEARCH_API_KEY=xxx npx @mcp-toolkit/elasticsearch

# With basic auth
ELASTICSEARCH_URL=http://localhost:9200 ELASTICSEARCH_USERNAME=elastic ELASTICSEARCH_PASSWORD=changeme npx @mcp-toolkit/elasticsearch

# HTTP mode
MCP_TRANSPORT=streamable-http MCP_PORT=3001 ELASTICSEARCH_URL=http://localhost:9200 npx @mcp-toolkit/elasticsearch
```

### Claude Desktop / Cursor 配置

```json
{
  "mcpServers": {
    "elasticsearch": {
      "command": "npx",
      "args": ["@mcp-toolkit/elasticsearch"],
      "env": {
        "ELASTICSEARCH_URL": "http://localhost:9200"
      }
    }
  }
}
```

### 典型使用场景

**RAG / 向量搜索：**
```
search → 查询语义相似文档
index_document → 存储嵌入向量和文本
create_index → 创建带 dense_vector mapping 的索引
```

**日志分析：**
```
search → 按时间范围查询日志
count → 统计错误日志数量
cluster_health → 检查集群状态
```

**数据管道：**
```
bulk → 批量导入数据
list_indices → 查看所有索引
index_mapping → 检查字段映射
```
