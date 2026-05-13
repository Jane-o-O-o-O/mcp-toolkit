import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPrometheusTools, type PrometheusClient } from "../src/tools/index.js";

function createMockClient(): PrometheusClient {
  return {
    get: vi.fn(),
  };
}

describe("Prometheus MCP Tools", () => {
  let mockClient: ReturnType<typeof createMockClient>;
  let tools: ReturnType<typeof createPrometheusTools>;

  beforeEach(() => {
    mockClient = createMockClient();
    tools = createPrometheusTools(mockClient);
  });

  describe("tool definitions", () => {
    it("defines all expected tools", () => {
      const names = tools.map((t) => t.definition.name).sort();
      expect(names).toEqual([
        "alerts",
        "label_values",
        "metadata",
        "query",
        "query_range",
        "rules",
        "targets",
      ]);
    });

    it("each tool has required fields", () => {
      for (const tool of tools) {
        expect(tool.definition.name).toBeTruthy();
        expect(tool.definition.description).toBeTruthy();
        expect(tool.definition.inputSchema).toBeDefined();
        expect(typeof tool.handler).toBe("function");
      }
    });
  });

  describe("query", () => {
    it("executes an instant query", async () => {
      const mockResult = { status: "success", data: { resultType: "vector", result: [] } };
      vi.mocked(mockClient.get).mockResolvedValue(mockResult);

      const tool = tools.find((t) => t.definition.name === "query")!;
      const result = await tool.handler({ expr: "up" });

      expect(mockClient.get).toHaveBeenCalledWith("/api/v1/query", { query: "up" });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain("success");
    });

    it("passes optional time parameter", async () => {
      vi.mocked(mockClient.get).mockResolvedValue({ status: "success", data: { result: [] } });

      const tool = tools.find((t) => t.definition.name === "query")!;
      await tool.handler({ expr: "up", time: "2024-01-01T00:00:00Z" });

      expect(mockClient.get).toHaveBeenCalledWith("/api/v1/query", {
        query: "up",
        time: "2024-01-01T00:00:00Z",
      });
    });

    it("handles API errors", async () => {
      vi.mocked(mockClient.get).mockRejectedValue(new Error("Prometheus API error (500)"));

      const tool = tools.find((t) => t.definition.name === "query")!;
      const result = await tool.handler({ expr: "bad_expr" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Prometheus API error");
    });
  });

  describe("query_range", () => {
    it("executes a range query", async () => {
      vi.mocked(mockClient.get).mockResolvedValue({ status: "success", data: { result: [] } });

      const tool = tools.find((t) => t.definition.name === "query_range")!;
      const result = await tool.handler({
        expr: "rate(http_requests_total[5m])",
        start: "2024-01-01T00:00:00Z",
        end: "2024-01-01T01:00:00Z",
        step: "1m",
      });

      expect(mockClient.get).toHaveBeenCalledWith("/api/v1/query_range", {
        query: "rate(http_requests_total[5m])",
        start: "2024-01-01T00:00:00Z",
        end: "2024-01-01T01:00:00Z",
        step: "1m",
      });
      expect(result.isError).toBeFalsy();
    });
  });

  describe("targets", () => {
    it("lists all targets", async () => {
      const mockResult = {
        status: "success",
        data: { activeTargets: [{ labels: { instance: "localhost:9090" }, health: "up" }] },
      };
      vi.mocked(mockClient.get).mockResolvedValue(mockResult);

      const tool = tools.find((t) => t.definition.name === "targets")!;
      const result = await tool.handler({});

      expect(mockClient.get).toHaveBeenCalledWith("/api/v1/targets", {});
      expect(result.content[0].text).toContain("activeTargets");
    });

    it("filters by state", async () => {
      vi.mocked(mockClient.get).mockResolvedValue({ status: "success", data: {} });

      const tool = tools.find((t) => t.definition.name === "targets")!;
      await tool.handler({ state: "active" });

      expect(mockClient.get).toHaveBeenCalledWith("/api/v1/targets", { state: "active" });
    });
  });

  describe("alerts", () => {
    it("lists firing alerts", async () => {
      const mockResult = { status: "success", data: { alerts: [] } };
      vi.mocked(mockClient.get).mockResolvedValue(mockResult);

      const tool = tools.find((t) => t.definition.name === "alerts")!;
      const result = await tool.handler({});

      expect(mockClient.get).toHaveBeenCalledWith("/api/v1/alerts");
      expect(result.isError).toBeFalsy();
    });
  });

  describe("rules", () => {
    it("lists alerting and recording rules", async () => {
      vi.mocked(mockClient.get).mockResolvedValue({ status: "success", data: { groups: [] } });

      const tool = tools.find((t) => t.definition.name === "rules")!;
      const result = await tool.handler({});

      expect(mockClient.get).toHaveBeenCalledWith("/api/v1/rules");
      expect(result.isError).toBeFalsy();
    });
  });

  describe("label_values", () => {
    it("gets values for a label", async () => {
      vi.mocked(mockClient.get).mockResolvedValue({ status: "success", data: ["api", "web"] });

      const tool = tools.find((t) => t.definition.name === "label_values")!;
      const result = await tool.handler({ label: "job" });

      expect(mockClient.get).toHaveBeenCalledWith("/api/v1/label/job/values", {});
      expect(result.content[0].text).toContain("api");
    });

    it("passes match filter", async () => {
      vi.mocked(mockClient.get).mockResolvedValue({ status: "success", data: [] });

      const tool = tools.find((t) => t.definition.name === "label_values")!;
      await tool.handler({ label: "instance", match: '{job="api"}' });

      expect(mockClient.get).toHaveBeenCalledWith("/api/v1/label/instance/values", {
        "match[]": '{job="api"}',
      });
    });
  });

  describe("metadata", () => {
    it("gets metadata for all metrics", async () => {
      vi.mocked(mockClient.get).mockResolvedValue({ status: "success", data: {} });

      const tool = tools.find((t) => t.definition.name === "metadata")!;
      const result = await tool.handler({});

      expect(mockClient.get).toHaveBeenCalledWith("/api/v1/metadata", {});
      expect(result.isError).toBeFalsy();
    });

    it("gets metadata for specific metric", async () => {
      vi.mocked(mockClient.get).mockResolvedValue({
        status: "success",
        data: { up: [{ type: "gauge", help: "1 if the target is up" }] },
      });

      const tool = tools.find((t) => t.definition.name === "metadata")!;
      const result = await tool.handler({ metric: "up" });

      expect(mockClient.get).toHaveBeenCalledWith("/api/v1/metadata", { metric: "up" });
      expect(result.content[0].text).toContain("gauge");
    });
  });
});
