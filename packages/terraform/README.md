# @mcp-toolkit/terraform

Terraform MCP Server — workspace management, plan/apply/destroy, state inspection.

## Tools (8)

| Tool | Description |
|------|-------------|
| `list_workspaces` | List all Terraform workspaces |
| `select_workspace` | Switch to a different workspace |
| `plan` | Run terraform plan to preview changes |
| `apply` | Run terraform apply to provision infrastructure |
| `destroy` | Run terraform destroy to tear down infrastructure |
| `output` | Show Terraform output values |
| `state_list` | List all resources in state |
| `state_show` | Show details of a specific resource |

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `TF_WORK_DIR` | `.` | Terraform working directory |
| `TF_BINARY` | `terraform` | Path to terraform binary |
| `TF_VAR_FILE` | — | Variable file to use |
| `TF_AUTO_APPROVE` | `false` | Auto-approve apply/destroy |
| `MCP_TRANSPORT` | `stdio` | Transport: `stdio`, `sse`, `streamable-http` |
| `MCP_PORT` | `3000` | Port for HTTP transport |
| `MCP_LOG_LEVEL` | `info` | Log level: `debug`, `info`, `warn`, `error` |

## Usage

```bash
npx @mcp-toolkit/terraform
```

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "terraform": {
      "command": "npx",
      "args": ["@mcp-toolkit/terraform"],
      "env": {
        "TF_WORK_DIR": "/path/to/terraform/project"
      }
    }
  }
}
```
