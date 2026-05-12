import type { FetchClient } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createFetchTools(fetcher: FetchClient): McpTool[] {
  const httpGetTool: McpTool = {
    definition: {
      name: "http_get",
      description:
        "Make an HTTP GET request. Returns status, headers, and response body. Supports custom headers and timeout.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to fetch" },
          headers: { type: "object", description: "Custom HTTP headers (optional)" },
          timeout: { type: "number", description: "Request timeout in ms (default: 30000)" },
        },
        required: ["url"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const resp = await fetcher.request({
            url: args.url as string,
            method: "GET",
            headers: args.headers as Record<string, string> | undefined,
            timeout: args.timeout as number | undefined,
          });
          return formatResponse(resp);
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const httpPostTool: McpTool = {
    definition: {
      name: "http_post",
      description:
        "Make an HTTP POST request with a body. Returns status, headers, and response body. Set Content-Type header for JSON/form data.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to post to" },
          body: { type: "string", description: "Request body (string)" },
          headers: { type: "object", description: "Custom HTTP headers" },
          timeout: { type: "number", description: "Request timeout in ms" },
        },
        required: ["url"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const resp = await fetcher.request({
            url: args.url as string,
            method: "POST",
            body: args.body as string | undefined,
            headers: args.headers as Record<string, string> | undefined,
            timeout: args.timeout as number | undefined,
          });
          return formatResponse(resp);
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const httpPutTool: McpTool = {
    definition: {
      name: "http_put",
      description: "Make an HTTP PUT request.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL" },
          body: { type: "string", description: "Request body" },
          headers: { type: "object", description: "Custom HTTP headers" },
          timeout: { type: "number", description: "Timeout in ms" },
        },
        required: ["url"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const resp = await fetcher.request({
            url: args.url as string,
            method: "PUT",
            body: args.body as string | undefined,
            headers: args.headers as Record<string, string> | undefined,
            timeout: args.timeout as number | undefined,
          });
          return formatResponse(resp);
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const httpDeleteTool: McpTool = {
    definition: {
      name: "http_delete",
      description: "Make an HTTP DELETE request.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL" },
          headers: { type: "object", description: "Custom HTTP headers" },
          timeout: { type: "number", description: "Timeout in ms" },
        },
        required: ["url"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const resp = await fetcher.request({
            url: args.url as string,
            method: "DELETE",
            headers: args.headers as Record<string, string> | undefined,
            timeout: args.timeout as number | undefined,
          });
          return formatResponse(resp);
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  const httpPatchTool: McpTool = {
    definition: {
      name: "http_patch",
      description: "Make an HTTP PATCH request.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL" },
          body: { type: "string", description: "Request body" },
          headers: { type: "object", description: "Custom HTTP headers" },
          timeout: { type: "number", description: "Timeout in ms" },
        },
        required: ["url"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const resp = await fetcher.request({
            url: args.url as string,
            method: "PATCH",
            body: args.body as string | undefined,
            headers: args.headers as Record<string, string> | undefined,
            timeout: args.timeout as number | undefined,
          });
          return formatResponse(resp);
        },
        (r) => JSON.stringify(r, null, 2),
      );
    },
  };

  return [httpGetTool, httpPostTool, httpPutTool, httpDeleteTool, httpPatchTool];
}

function formatResponse(resp: { status: number; statusText: string; headers: Record<string, string>; body: string }) {
  const contentType = resp.headers["content-type"] ?? "";
  let parsedBody: unknown;

  if (contentType.includes("application/json")) {
    try {
      parsedBody = JSON.parse(resp.body);
    } catch {
      parsedBody = resp.body;
    }
  } else {
    parsedBody = resp.body.length > 5000 ? resp.body.slice(0, 5000) + "... [truncated]" : resp.body;
  }

  return {
    status: resp.status,
    statusText: resp.statusText,
    headers: resp.headers,
    body: parsedBody,
  };
}
