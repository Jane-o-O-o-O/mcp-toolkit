import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFetchTools, type FetchClient } from "../src/tools/index.js";

function createMockFetch(): FetchClient {
  return {
    request: vi.fn(),
  };
}

describe("Fetch MCP Tools", () => {
  let mockFetch: ReturnType<typeof createMockFetch>;
  let tools: ReturnType<typeof createFetchTools>;

  beforeEach(() => {
    mockFetch = createMockFetch();
    tools = createFetchTools(mockFetch);
  });

  describe("tool definitions", () => {
    it("defines all expected tools", () => {
      const names = tools.map((t) => t.definition.name).sort();
      expect(names).toEqual([
        "http_delete",
        "http_get",
        "http_patch",
        "http_post",
        "http_put",
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

  describe("http_get", () => {
    it("makes a GET request", async () => {
      vi.mocked(mockFetch.request).mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        body: '{"hello":"world"}',
      });
      const tool = tools.find((t) => t.definition.name === "http_get")!;
      const result = await tool.handler({ url: "https://api.example.com/data" });
      expect(mockFetch.request).toHaveBeenCalledWith({
        url: "https://api.example.com/data",
        method: "GET",
        headers: undefined,
        timeout: undefined,
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.status).toBe(200);
      expect(parsed.body).toEqual({ hello: "world" });
    });

    it("passes custom headers", async () => {
      vi.mocked(mockFetch.request).mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        body: "ok",
      });
      const tool = tools.find((t) => t.definition.name === "http_get")!;
      await tool.handler({
        url: "https://example.com",
        headers: { Authorization: "Bearer token" },
      });
      expect(mockFetch.request).toHaveBeenCalledWith(
        expect.objectContaining({ headers: { Authorization: "Bearer token" } }),
      );
    });

    it("returns error on failure", async () => {
      vi.mocked(mockFetch.request).mockRejectedValue(new Error("Network error"));
      const tool = tools.find((t) => t.definition.name === "http_get")!;
      const result = await tool.handler({ url: "https://fail.example.com" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Network error");
    });
  });

  describe("http_post", () => {
    it("makes a POST request with body", async () => {
      vi.mocked(mockFetch.request).mockResolvedValue({
        status: 201,
        statusText: "Created",
        headers: { "content-type": "application/json" },
        body: '{"id":1}',
      });
      const tool = tools.find((t) => t.definition.name === "http_post")!;
      const result = await tool.handler({
        url: "https://api.example.com/users",
        body: '{"name":"Bob"}',
        headers: { "Content-Type": "application/json" },
      });
      expect(mockFetch.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          body: '{"name":"Bob"}',
        }),
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.status).toBe(201);
    });
  });

  describe("http_put", () => {
    it("makes a PUT request", async () => {
      vi.mocked(mockFetch.request).mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        body: "updated",
      });
      const tool = tools.find((t) => t.definition.name === "http_put")!;
      await tool.handler({ url: "https://api.example.com/users/1", body: '{"name":"Updated"}' });
      expect(mockFetch.request).toHaveBeenCalledWith(
        expect.objectContaining({ method: "PUT" }),
      );
    });
  });

  describe("http_delete", () => {
    it("makes a DELETE request", async () => {
      vi.mocked(mockFetch.request).mockResolvedValue({
        status: 204,
        statusText: "No Content",
        headers: {},
        body: "",
      });
      const tool = tools.find((t) => t.definition.name === "http_delete")!;
      await tool.handler({ url: "https://api.example.com/users/1" });
      expect(mockFetch.request).toHaveBeenCalledWith(
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  describe("http_patch", () => {
    it("makes a PATCH request", async () => {
      vi.mocked(mockFetch.request).mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        body: "patched",
      });
      const tool = tools.find((t) => t.definition.name === "http_patch")!;
      await tool.handler({ url: "https://api.example.com/users/1", body: '{"name":"Patched"}' });
      expect(mockFetch.request).toHaveBeenCalledWith(
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });

  describe("response formatting", () => {
    it("parses JSON response body", async () => {
      vi.mocked(mockFetch.request).mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: '{"key":"value"}',
      });
      const tool = tools.find((t) => t.definition.name === "http_get")!;
      const result = await tool.handler({ url: "https://example.com" });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.body).toEqual({ key: "value" });
    });

    it("keeps non-JSON body as string", async () => {
      vi.mocked(mockFetch.request).mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: { "content-type": "text/html" },
        body: "<html>hello</html>",
      });
      const tool = tools.find((t) => t.definition.name === "http_get")!;
      const result = await tool.handler({ url: "https://example.com" });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.body).toBe("<html>hello</html>");
    });

    it("truncates large text responses", async () => {
      const bigBody = "x".repeat(6000);
      vi.mocked(mockFetch.request).mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: { "content-type": "text/plain" },
        body: bigBody,
      });
      const tool = tools.find((t) => t.definition.name === "http_get")!;
      const result = await tool.handler({ url: "https://example.com" });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.body).toContain("truncated");
      expect(parsed.body.length).toBeLessThan(bigBody.length);
    });
  });
});
