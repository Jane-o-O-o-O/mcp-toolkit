# @mcp-toolkit/ansible

Ansible MCP Server — playbook execution, inventory management, vault operations, Galaxy integration.

## Tools (8)

| Tool | Description |
|------|-------------|
| `run_playbook` | Run an Ansible playbook with optional inventory and extra vars |
| `list_hosts` | List all hosts in the inventory, optionally filtered by pattern |
| `run_adhoc` | Run an Ansible ad-hoc command on managed hosts |
| `list_roles` | List installed Ansible roles |
| `list_collections` | List installed Ansible collections |
| `vault_encrypt` | Encrypt a string using Ansible Vault |
| `vault_decrypt` | Decrypt an Ansible Vault encrypted string |
| `galaxy_install` | Install a role or collection from Ansible Galaxy |

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `ANSIBLE_INVENTORY` | — | Inventory file or directory |
| `ANSIBLE_PLAYBOOK_DIR` | `.` | Playbook directory |
| `ANSIBLE_BINARY` | `ansible-playbook` | Path to ansible-playbook binary |
| `ANSIBLE_VAULT_PASSWORD_FILE` | — | Vault password file |
| `ANSIBLE_PRIVATE_KEY` | — | SSH private key path |
| `MCP_TRANSPORT` | `stdio` | Transport: `stdio`, `sse`, `streamable-http` |
| `MCP_PORT` | `3000` | Port for HTTP transport |
| `MCP_LOG_LEVEL` | `info` | Log level: `debug`, `info`, `warn`, `error` |

## Usage

```bash
npx @mcp-toolkit/ansible
```

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "ansible": {
      "command": "npx",
      "args": ["@mcp-toolkit/ansible"],
      "env": {
        "ANSIBLE_INVENTORY": "/etc/ansible/hosts",
        "ANSIBLE_PLAYBOOK_DIR": "/opt/ansible"
      }
    }
  }
}
```
