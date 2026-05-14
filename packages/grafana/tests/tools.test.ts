import { describe, it, expect, vi } from "vitest";
import { createGrafanaTools } from "../src/tools/index.js";
import type { GrafanaClient } from "../src/tools/types.js";

function mockGrafanaClient(overrides: Partial<GrafanaClient> = {}): GrafanaClient {
  return {
    listDashboards: vi.fn().mockResolvedValue([
      {
        uid: "abc123",
        title: "Node Exporter",
        url: "/d/abc123/node-exporter",
        tags: ["linux", "monitoring"],
        folderTitle: "Infrastructure",
        updated: "2026-05-13T10:00:00Z",
      },
    ]),
    getDashboard: vi.fn().mockResolvedValue({
      uid: "abc123",
      title: "Node Exporter",
      tags: ["linux", "monitoring"],
      panels: [
        { id: 1, title: "CPU Usage", type: "graph" },
        { id: 2, title: "Memory Usage", type: "gauge" },
      ],
      templating: [{ name: "instance", type: "query" }],
      time: { from: "now-6h", to: "now" },
      version: 5,
    }),
    createDashboard: vi.fn().mockResolvedValue({
      uid: "new-dash-uid",
      url: "/d/new-dash-uid/my-dashboard",
      version: 1,
      status: "success",
    }),
    listDatasources: vi.fn().mockResolvedValue([
      {
        id: 1,
        uid: "prom-uid",
        name: "Prometheus",
        type: "prometheus",
        url: "http://localhost:9090",
        isDefault: true,
      },
      {
        id: 2,
        uid: "es-uid",
        name: "Elasticsearch",
        type: "elasticsearch",
        url: "http://localhost:9200",
        isDefault: false,
      },
    ]),
    queryDatasource: vi.fn().mockResolvedValue({
      results: [
        {
          series: [
            {
              name: "up",
              columns: ["Time", "Value"],
              values: [[1700000000000, 1]],
            },
          ],
        },
      ],
    }),
    listAlertRules: vi.fn().mockResolvedValue([
      {
        uid: "alert-001",
        title: "High CPU",
        state: "firing",
        folderUid: "infra",
        updated: "2026-05-14T08:00:00Z",
        condition: "A > 90",
      },
    ]),
    createAnnotation: vi.fn().mockResolvedValue({
      id: 42,
      message: "Deployed v2.0",
    }),
    search: vi.fn().mockResolvedValue([
      {
        uid: "abc123",
        title: "Node Exporter",
        url: "/d/abc123/node-exporter",
        type: "dash-db",
        tags: ["linux"],
      },
    ]),
    ...overrides,
  };
}

describe("Grafana tools", () => {
  it("should have 8 tools", () => {
    const tools = createGrafanaTools(mockGrafanaClient());
    expect(tools).toHaveLength(8);
  });

  describe("list_dashboards", () => {
    it("should list dashboards", async () => {
      const client = mockGrafanaClient();
      const tools = createGrafanaTools(client);
      const tool = tools.find((t) => t.definition.name === "list_dashboards")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Node Exporter");
      expect(result.content[0].text).toContain("Infrastructure");
    });
  });

  describe("get_dashboard", () => {
    it("should get dashboard by uid", async () => {
      const client = mockGrafanaClient();
      const tools = createGrafanaTools(client);
      const tool = tools.find((t) => t.definition.name === "get_dashboard")!;

      const result = await tool.handler({ uid: "abc123" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("CPU Usage");
      expect(result.content[0].text).toContain("Memory Usage");
      expect(client.getDashboard).toHaveBeenCalledWith("abc123");
    });
  });

  describe("create_dashboard", () => {
    it("should create a dashboard", async () => {
      const client = mockGrafanaClient();
      const tools = createGrafanaTools(client);
      const tool = tools.find((t) => t.definition.name === "create_dashboard")!;

      const result = await tool.handler({
        title: "My Dashboard",
        tags: ["custom"],
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("new-dash-uid");
      expect(result.content[0].text).toContain("success");
    });

    it("should create with overwrite", async () => {
      const client = mockGrafanaClient();
      const tools = createGrafanaTools(client);
      const tool = tools.find((t) => t.definition.name === "create_dashboard")!;

      await tool.handler({ title: "My Dashboard", overwrite: true });
      expect(client.createDashboard).toHaveBeenCalledWith(
        expect.objectContaining({ overwrite: true }),
      );
    });
  });

  describe("list_datasources", () => {
    it("should list datasources", async () => {
      const client = mockGrafanaClient();
      const tools = createGrafanaTools(client);
      const tool = tools.find((t) => t.definition.name === "list_datasources")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Prometheus");
      expect(result.content[0].text).toContain("Elasticsearch");
    });
  });

  describe("query_datasource", () => {
    it("should query a datasource", async () => {
      const client = mockGrafanaClient();
      const tools = createGrafanaTools(client);
      const tool = tools.find((t) => t.definition.name === "query_datasource")!;

      const result = await tool.handler({
        datasourceId: 1,
        query: "up",
        from: "now-1h",
        to: "now",
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("up");
      expect(client.queryDatasource).toHaveBeenCalledWith(1, "up", "now-1h", "now");
    });
  });

  describe("list_alert_rules", () => {
    it("should list alert rules", async () => {
      const client = mockGrafanaClient();
      const tools = createGrafanaTools(client);
      const tool = tools.find((t) => t.definition.name === "list_alert_rules")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("High CPU");
      expect(result.content[0].text).toContain("firing");
    });
  });

  describe("create_annotation", () => {
    it("should create an annotation", async () => {
      const client = mockGrafanaClient();
      const tools = createGrafanaTools(client);
      const tool = tools.find((t) => t.definition.name === "create_annotation")!;

      const result = await tool.handler({
        text: "Deployed v2.0",
        tags: ["deploy"],
      });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("42");
      expect(client.createAnnotation).toHaveBeenCalledWith("Deployed v2.0", ["deploy"], undefined, undefined, undefined);
    });

    it("should create with dashboard uid and time", async () => {
      const client = mockGrafanaClient();
      const tools = createGrafanaTools(client);
      const tool = tools.find((t) => t.definition.name === "create_annotation")!;

      await tool.handler({
        text: "Note",
        dashboardUid: "dash-1",
        time: 1700000000000,
      });
      expect(client.createAnnotation).toHaveBeenCalledWith("Note", undefined, "dash-1", 1700000000000, undefined);
    });
  });

  describe("search", () => {
    it("should search by query", async () => {
      const client = mockGrafanaClient();
      const tools = createGrafanaTools(client);
      const tool = tools.find((t) => t.definition.name === "search")!;

      const result = await tool.handler({ query: "node" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Node Exporter");
      expect(client.search).toHaveBeenCalledWith("node", undefined);
    });

    it("should search with type filter", async () => {
      const client = mockGrafanaClient();
      const tools = createGrafanaTools(client);
      const tool = tools.find((t) => t.definition.name === "search")!;

      await tool.handler({ query: "node", type: "dash-db" });
      expect(client.search).toHaveBeenCalledWith("node", "dash-db");
    });
  });

  describe("error handling", () => {
    it("should return error on API failure", async () => {
      const client = mockGrafanaClient({
        listDashboards: vi.fn().mockRejectedValue(new Error("Unauthorized")),
      });
      const tools = createGrafanaTools(client);
      const tool = tools.find((t) => t.definition.name === "list_dashboards")!;

      const result = await tool.handler({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unauthorized");
    });
  });
});
