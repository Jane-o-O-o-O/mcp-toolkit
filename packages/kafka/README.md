# @mcp-toolkit/kafka

Kafka MCP Server — topic management, message produce/consume, consumer group monitoring.

## Tools

| Tool | Description |
|------|-------------|
| `list_topics` | List all topics with partition/replication info |
| `create_topic` | Create a new topic |
| `delete_topic` | Delete a topic |
| `produce_message` | Produce a message to a topic |
| `consume_messages` | Consume messages from a topic (batch read) |
| `describe_topic` | Get topic details: partitions, offsets, configs |
| `list_consumer_groups` | List all consumer groups |
| `describe_consumer_group` | Get consumer group details: members, assignments, offsets |

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `KAFKA_BROKERS` | `localhost:9092` | Comma-separated broker list |
| `KAFKA_CLIENT_ID` | `mcp-toolkit-kafka` | Client identifier |
| `KAFKA_SASL_USERNAME` | (none) | SASL username |
| `KAFKA_SASL_PASSWORD` | (none) | SASL password |
| `KAFKA_SASL_MECHANISM` | (none) | SASL mechanism: `plain`, `scram-sha-256`, `scram-sha-512` |
| `KAFKA_SSL` | `false` | Enable SSL |
| `MCP_LOG_LEVEL` | `info` | Log level |
| `MCP_TRANSPORT` | `stdio` | Transport: `stdio`, `sse`, `streamable-http` |
| `MCP_PORT` | `3000` | HTTP port (for sse/streamable-http) |

## Claude Desktop Configuration

```json
{
  "mcpServers": {
    "kafka": {
      "command": "npx",
      "args": ["@mcp-toolkit/kafka"],
      "env": {
        "KAFKA_BROKERS": "localhost:9092"
      }
    }
  }
}
```

### With SASL authentication
```json
{
  "mcpServers": {
    "kafka": {
      "command": "npx",
      "args": ["@mcp-toolkit/kafka"],
      "env": {
        "KAFKA_BROKERS": "kafka.example.com:9093",
        "KAFKA_SASL_USERNAME": "user",
        "KAFKA_SASL_PASSWORD": "pass",
        "KAFKA_SASL_MECHANISM": "scram-sha-256",
        "KAFKA_SSL": "true"
      }
    }
  }
}
```
