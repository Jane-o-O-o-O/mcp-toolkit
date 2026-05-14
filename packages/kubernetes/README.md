# @mcp-toolkit/kubernetes

Kubernetes MCP Server — manage pods, deployments, services, logs, namespaces, and any resource directly from your AI agent.

## Tools (8)

| Tool | Description |
|------|-------------|
| `list_pods` | List pods in a namespace with status, ready state, restarts, node |
| `get_pod` | Get detailed pod info — containers, conditions, IP, node |
| `list_deployments` | List deployments with ready/up-to-date/available replicas |
| `scale_deployment` | Scale a deployment to N replicas |
| `list_services` | List services with type, cluster IP, ports |
| `get_logs` | Get pod logs (last N lines) |
| `list_namespaces` | List all namespaces with status |
| `describe_resource` | Describe any resource (pod, deployment, service, configmap, secret, namespace) |

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `KUBECONFIG` | `~/.kube/config` | Path to kubeconfig file |
| `K8S_CONTEXT` | current context | Kubernetes context to use |
| `K8S_NAMESPACE` | `default` | Default namespace |
| `K8S_SERVER` | — | API server URL (for in-cluster auth) |
| `K8S_TOKEN` | — | Service account token (for in-cluster auth) |
| `MCP_LOG_LEVEL` | `info` | Log level |
| `MCP_TRANSPORT` | `stdio` | Transport: stdio, sse, streamable-http |
| `MCP_PORT` | `3000` | Port for HTTP transports |

## Quick Start

```bash
# Using default kubeconfig
npx @mcp-toolkit/kubernetes

# With specific context and namespace
K8S_CONTEXT=minikube K8S_NAMESPACE=production npx @mcp-toolkit/kubernetes

# In-cluster (service account)
K8S_SERVER=https://kubernetes.default.svc K8S_TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token) npx @mcp-toolkit/kubernetes

# HTTP mode
MCP_TRANSPORT=streamable-http MCP_PORT=3002 npx @mcp-toolkit/kubernetes
```

### Claude Desktop / Cursor

```json
{
  "mcpServers": {
    "kubernetes": {
      "command": "npx",
      "args": ["@mcp-toolkit/kubernetes"],
      "env": {
        "K8S_CONTEXT": "minikube",
        "K8S_NAMESPACE": "default"
      }
    }
  }
}
```

## License

MIT
