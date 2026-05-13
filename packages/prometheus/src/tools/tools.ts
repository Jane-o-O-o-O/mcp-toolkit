import type { PrometheusClient } from "./types.js";
import type { McpTool, ToolResult } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createPrometheusTools(client: PrometheusClient): McpTool[] {
  function promSafeRun<T>(fn: () => Promise<T>, format?: (r: T) => string): Promise<ToolResult> {
    return safeRun(fn, format);
  }

  const queryTool: McpTool = {
    definition: {
      name: "query",
      description: "Execute an instant PromQL query against Prometheus. Returns the current value(s) for the given expression.",
      inputSchema: {
        type: "object",
        properties: {
          expr: { type: "string", description: "PromQL expression (e.g. up, rate(http_requests_total[5m]))" },
          time: { type: "string", description: "Evaluation timestamp (RFC3333 or Unix timestamp, optional)" },
        },
        required: ["expr"],
      },
    },
    handler: async (args) => {
      const params: Record<string, string> = { query: args.expr as string };
      if (args.time) params.time = args.time as string;
      return promSafeRun(
        () => client.get("/api/v1/query", params),
        (data) => JSON.stringify(data, null, 2),
      );
    },
  };

  const queryRangeTool: McpTool = {
    definition: {
      name: "query_range",
      description: "Execute a range PromQL query. Returns a matrix of values over a time range.",
      inputSchema: {
        type: "object",
        properties: {
          expr: { type: "string", description: "PromQL expression" },
          start: { type: "string", description: "Start timestamp (RFC3333 or Unix)" },
          end: { type: "string", description: "End timestamp (RFC3333 or Unix)" },
          step: { type: "string", description: "Query resolution step (e.g. 15s, 1m, 1h)" },
        },
        required: ["expr", "start", "end", "step"],
      },
    },
    handler: async (args) => {
      return promSafeRun(
        () => client.get("/api/v1/query_range", {
          query: args.expr as string,
          start: args.start as string,
          end: args.end as string,
          step: args.step as string,
        }),
        (data) => JSON.stringify(data, null, 2),
      );
    },
  };

  const targetsTool: McpTool = {
    definition: {
      name: "targets",
      description: "List all Prometheus scrape targets and their current state (up/down).",
      inputSchema: {
        type: "object",
        properties: {
          state: { type: "string", description: "Filter by state: active, dropped, or any (default: any)" },
        },
      },
    },
    handler: async (args) => {
      const params: Record<string, string> = {};
      if (args.state) params.state = args.state as string;
      return promSafeRun(
        () => client.get("/api/v1/targets", params),
        (data) => JSON.stringify(data, null, 2),
      );
    },
  };

  const alertsTool: McpTool = {
    definition: {
      name: "alerts",
      description: "List all currently firing alerts in Prometheus.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () => {
      return promSafeRun(
        () => client.get("/api/v1/alerts"),
        (data) => JSON.stringify(data, null, 2),
      );
    },
  };

  const rulesTool: McpTool = {
    definition: {
      name: "rules",
      description: "List all alerting and recording rules with their current state.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () => {
      return promSafeRun(
        () => client.get("/api/v1/rules"),
        (data) => JSON.stringify(data, null, 2),
      );
    },
  };

  const labelValuesTool: McpTool = {
    definition: {
      name: "label_values",
      description: "Get all values for a given label name. Useful for discovering available metrics or instances.",
      inputSchema: {
        type: "object",
        properties: {
          label: { type: "string", description: "Label name (e.g. __name__, instance, job)" },
          match: { type: "string", description: "Series selector to filter by (optional, e.g. {job=\"api\"})" },
        },
        required: ["label"],
      },
    },
    handler: async (args) => {
      const params: Record<string, string> = {};
      if (args.match) params["match[]"] = args.match as string;
      return promSafeRun(
        () => client.get(`/api/v1/label/${args.label as string}/values`, params),
        (data) => JSON.stringify(data, null, 2),
      );
    },
  };

  const metadataTool: McpTool = {
    definition: {
      name: "metadata",
      description: "Get metadata (HELP, TYPE) for metrics. Optionally filter by metric name.",
      inputSchema: {
        type: "object",
        properties: {
          metric: { type: "string", description: "Metric name to get metadata for (optional, returns all if omitted)" },
        },
      },
    },
    handler: async (args) => {
      const params: Record<string, string> = {};
      if (args.metric) params.metric = args.metric as string;
      return promSafeRun(
        () => client.get("/api/v1/metadata", params),
        (data) => JSON.stringify(data, null, 2),
      );
    },
  };

  return [queryTool, queryRangeTool, targetsTool, alertsTool, rulesTool, labelValuesTool, metadataTool];
}
