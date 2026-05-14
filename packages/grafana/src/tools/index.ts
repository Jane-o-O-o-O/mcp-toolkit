import type { GrafanaClient } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createGrafanaTools(grafana: GrafanaClient): McpTool[] {
  const listDashboardsTool: McpTool = {
    definition: {
      name: "list_dashboards",
      description: "List all Grafana dashboards with title, tags, folder, and last updated time.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () => {
      return safeRun(
        async () => {
          const dashboards = await grafana.listDashboards();
          return dashboards;
        },
        (d) => JSON.stringify(d, null, 2),
      );
    },
  };

  const getDashboardTool: McpTool = {
    definition: {
      name: "get_dashboard",
      description: "Get a Grafana dashboard by UID including panels, templates, and time range.",
      inputSchema: {
        type: "object",
        properties: {
          uid: { type: "string", description: "Dashboard UID" },
        },
        required: ["uid"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const dashboard = await grafana.getDashboard(args.uid as string);
          return dashboard;
        },
        (d) => JSON.stringify(d, null, 2),
      );
    },
  };

  const createDashboardTool: McpTool = {
    definition: {
      name: "create_dashboard",
      description: "Create or update a Grafana dashboard. Returns the dashboard UID and URL.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Dashboard title" },
          tags: { type: "array", items: { type: "string" }, description: "Dashboard tags" },
          panels: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                title: { type: "string" },
                type: { type: "string" },
              },
            },
            description: "Dashboard panels",
          },
          folderUid: { type: "string", description: "Folder UID to place dashboard in" },
          overwrite: { type: "boolean", description: "Overwrite existing dashboard with same UID (default: false)" },
        },
        required: ["title"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const result = await grafana.createDashboard({
            dashboard: {
              title: args.title as string,
              tags: args.tags as string[] | undefined,
              panels: args.panels as Array<{ id: number; title: string; type: string }> | undefined,
            },
            folderUid: args.folderUid as string | undefined,
            overwrite: args.overwrite as boolean | undefined,
          });
          return result;
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const listDatasourcesTool: McpTool = {
    definition: {
      name: "list_datasources",
      description: "List all configured Grafana datasources with name, type, URL, and default status.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () => {
      return safeRun(
        async () => {
          const datasources = await grafana.listDatasources();
          return datasources;
        },
        (ds) => JSON.stringify(ds, null, 2),
      );
    },
  };

  const queryDatasourceTool: McpTool = {
    definition: {
      name: "query_datasource",
      description: "Query a Grafana datasource (e.g. Prometheus, Elasticsearch) using its native query language.",
      inputSchema: {
        type: "object",
        properties: {
          datasourceId: { type: "number", description: "Datasource ID" },
          query: { type: "string", description: "Query string (PromQL, Lucene, SQL, etc.)" },
          from: { type: "string", description: "Start time (e.g. 'now-1h', ISO timestamp)" },
          to: { type: "string", description: "End time (e.g. 'now', ISO timestamp)" },
        },
        required: ["datasourceId", "query"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const result = await grafana.queryDatasource(
            args.datasourceId as number,
            args.query as string,
            args.from as string | undefined,
            args.to as string | undefined,
          );
          return result;
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const listAlertRulesTool: McpTool = {
    definition: {
      name: "list_alert_rules",
      description: "List all Grafana alert rules with state, condition, and folder.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () => {
      return safeRun(
        async () => {
          const rules = await grafana.listAlertRules();
          return rules;
        },
        (rules) => JSON.stringify(rules, null, 2),
      );
    },
  };

  const createAnnotationTool: McpTool = {
    definition: {
      name: "create_annotation",
      description: "Create an annotation in Grafana (e.g. deployment, incident marker).",
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string", description: "Annotation text" },
          tags: { type: "array", items: { type: "string" }, description: "Annotation tags" },
          dashboardUid: { type: "string", description: "Dashboard UID (omit for global annotation)" },
          time: { type: "number", description: "Annotation timestamp in ms (default: now)" },
          timeEnd: { type: "number", description: "End timestamp in ms for range annotations" },
        },
        required: ["text"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const result = await grafana.createAnnotation(
            args.text as string,
            args.tags as string[] | undefined,
            args.dashboardUid as string | undefined,
            args.time as number | undefined,
            args.timeEnd as number | undefined,
          );
          return result;
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const searchTool: McpTool = {
    definition: {
      name: "search",
      description: "Search Grafana dashboards, folders, and panels by query string.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          type: { type: "string", description: "Filter by type: dash-db, dash-folder, dash-home (default: all)" },
        },
        required: ["query"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const results = await grafana.search(
            args.query as string,
            args.type as string | undefined,
          );
          return results;
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  return [
    listDashboardsTool,
    getDashboardTool,
    createDashboardTool,
    listDatasourcesTool,
    queryDatasourceTool,
    listAlertRulesTool,
    createAnnotationTool,
    searchTool,
  ];
}
