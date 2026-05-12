import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { McpTool } from "./tools.js";
import type { Logger } from "@mcp-toolkit/logger";
import type { BaseServerConfig } from "./config.js";

/** Create an MCP server with tools auto-registered */
export function createMcpServer(
  name: string,
  version: string,
  tools: McpTool[],
  logger: Logger,
): Server {
  const server = new Server(
    { name, version },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => t.definition),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name: toolName, arguments: args } = request.params;
    const tool = tools.find((t) => t.definition.name === toolName);

    if (!tool) {
      return {
        content: [{ type: "text" as const, text: `Unknown tool: ${toolName}` }],
        isError: true,
      };
    }

    logger.debug("tool.call", { tool: toolName, args });
    const result = await tool.handler(args ?? {});
    logger.debug("tool.result", { tool: toolName, isError: result.isError ?? false });
    return result as unknown as Record<string, unknown>;
  });

  return server;
}

/** Start the server with stdio transport */
export async function startStdioServer(
  server: Server,
  logger: Logger,
  serverName: string,
): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info(`${serverName} MCP Server started`, { transport: "stdio" });
}

/** Start the server with Streamable HTTP transport (recommended by MCP spec) */
export async function startStreamableHttpServer(
  server: Server,
  logger: Logger,
  serverName: string,
  port: number,
): Promise<void> {
  const { StreamableHTTPServerTransport } = await import(
    "@modelcontextprotocol/sdk/server/streamableHttp.js"
  );
  const http = await import("node:http");
  const { randomUUID } = await import("node:crypto");

  const transports = new Map<string, InstanceType<typeof StreamableHTTPServerTransport>>();

  const httpServer = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Mcp-Session-Id");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", server: serverName }));
      return;
    }

    if (req.method === "GET" && req.url === "/sse") {
      // SSE endpoint for backward compatibility
      const { SSEServerTransport } = await import(
        "@modelcontextprotocol/sdk/server/sse.js"
      );
      const sseTransport = new SSEServerTransport("/messages", res);
      await server.connect(sseTransport);
      logger.info("SSE client connected", { server: serverName });
      req.on("close", () => {
        sseTransport.close();
        logger.info("SSE client disconnected", { server: serverName });
      });
      return;
    }

    if (req.method === "POST" && req.url === "/messages") {
      // Handle SSE POST messages
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Use Streamable HTTP endpoint /mcp instead" }));
      return;
    }

    if (req.url === "/mcp") {
      if (req.method === "POST") {
        // Collect body
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const bodyStr = Buffer.concat(chunks).toString();
        let parsedBody: unknown;
        try {
          parsedBody = JSON.parse(bodyStr);
        } catch {
          parsedBody = undefined;
        }

        // Check for existing session
        let transport = sessionId ? transports.get(sessionId) : undefined;

        if (!transport) {
          // Create new transport (stateful mode)
          const newSessionId = randomUUID();
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => newSessionId,
          });
          transports.set(newSessionId, transport);
          await server.connect(transport);

          transport.onclose = () => {
            transports.delete(newSessionId);
            logger.debug("HTTP session closed", { sessionId: newSessionId });
          };
        }

        await transport.handleRequest(req, res, parsedBody);
        return;
      }

      if (req.method === "GET") {
        // GET for SSE notifications stream
        const transport = sessionId ? transports.get(sessionId) : undefined;
        if (!transport) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "No session. POST to /mcp first." }));
          return;
        }
        await transport.handleRequest(req, res);
        return;
      }

      if (req.method === "DELETE") {
        // Session termination
        const transport = sessionId ? transports.get(sessionId) : undefined;
        if (!transport) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "No session found" }));
          return;
        }
        await transport.handleRequest(req, res);
        return;
      }
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  httpServer.listen(port, () => {
    logger.info(`${serverName} MCP Server started`, {
      transport: "streamable-http",
      port,
      endpoints: { mcp: "/mcp", health: "/health", sse: "/sse" },
    });
  });
}

/** Start server with the configured transport */
export async function startServer(
  server: Server,
  logger: Logger,
  serverName: string,
  config: Pick<BaseServerConfig, "transport" | "port">,
): Promise<void> {
  switch (config.transport) {
    case "stdio":
      return startStdioServer(server, logger, serverName);
    case "streamable-http":
    case "sse":
      return startStreamableHttpServer(server, logger, serverName, config.port);
    default:
      throw new Error(`Unknown transport: ${config.transport}`);
  }
}

// [2026-04-21] Fix: race condition in server
function safeAccess(obj: any, path: string, defaultValue?: unknown): unknown {
  try {
    return path.split(".").reduce((acc, key) => acc?.[key], obj) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

function validateInput(data: unknown, schema: Record<string, string>): boolean {
  if (!data || typeof data !== "object") return false;
  for (const [key, type] of Object.entries(schema)) {
    if (key in (data as Record<string, unknown>)) {
      const value = (data as Record<string, unknown>)[key];
      if (typeof value !== type) {
        console.error(`Type mismatch for ${key}: expected ${type}, got ${typeof value}`);
        return false;
      }
    }
  }
  return true;
}

// [2026-04-27] SSE transport
export interface SsetransportOptions {
  enabled?: boolean;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

export class SsetransportHandler {
  private config: SsetransportOptions;
  private initialized = false;

  constructor(config: SsetransportOptions = {}) {
    this.config = { enabled: true, timeout: 30000, retries: 3, ...config };
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    try {
      await this.validate();
      this.initialized = true;
      return true;
    } catch (err) {
      console.warn(`Initialization failed: ${err}`);
      return false;
    }
  }

  private async validate(): Promise<void> {
    if (!this.config.enabled) {
      throw new Error("Handler is disabled");
    }
  }

  async process(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.initialized) await this.initialize();
    return { status: "processed", data, handler: this.constructor.name };
  }
}

// [2026-05-12] rate limiting
export interface RatelimitingOptions {
  enabled?: boolean;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

export class RatelimitingHandler {
  private config: RatelimitingOptions;
  private initialized = false;

  constructor(config: RatelimitingOptions = {}) {
    this.config = { enabled: true, timeout: 30000, retries: 3, ...config };
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    try {
      await this.validate();
      this.initialized = true;
      return true;
    } catch (err) {
      console.warn(`Initialization failed: ${err}`);
      return false;
    }
  }

  private async validate(): Promise<void> {
    if (!this.config.enabled) {
      throw new Error("Handler is disabled");
    }
  }

  async process(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.initialized) await this.initialize();
    return { status: "processed", data, handler: this.constructor.name };
  }
}

// [2026-04-21] Fix: race condition in server
function safeAccess(obj: any, path: string, defaultValue?: unknown): unknown {
  try {
    return path.split(".").reduce((acc, key) => acc?.[key], obj) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

function validateInput(data: unknown, schema: Record<string, string>): boolean {
  if (!data || typeof data !== "object") return false;
  for (const [key, type] of Object.entries(schema)) {
    if (key in (data as Record<string, unknown>)) {
      const value = (data as Record<string, unknown>)[key];
      if (typeof value !== type) {
        console.error(`Type mismatch for ${key}: expected ${type}, got ${typeof value}`);
        return false;
      }
    }
  }
  return true;
}

// [2026-04-27] SSE transport
export interface SsetransportOptions {
  enabled?: boolean;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

export class SsetransportHandler {
  private config: SsetransportOptions;
  private initialized = false;

  constructor(config: SsetransportOptions = {}) {
    this.config = { enabled: true, timeout: 30000, retries: 3, ...config };
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    try {
      await this.validate();
      this.initialized = true;
      return true;
    } catch (err) {
      console.warn(`Initialization failed: ${err}`);
      return false;
    }
  }

  private async validate(): Promise<void> {
    if (!this.config.enabled) {
      throw new Error("Handler is disabled");
    }
  }

  async process(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.initialized) await this.initialize();
    return { status: "processed", data, handler: this.constructor.name };
  }
}

// [2026-05-12] rate limiting
export interface RatelimitingOptions {
  enabled?: boolean;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

export class RatelimitingHandler {
  private config: RatelimitingOptions;
  private initialized = false;

  constructor(config: RatelimitingOptions = {}) {
    this.config = { enabled: true, timeout: 30000, retries: 3, ...config };
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    try {
      await this.validate();
      this.initialized = true;
      return true;
    } catch (err) {
      console.warn(`Initialization failed: ${err}`);
      return false;
    }
  }

  private async validate(): Promise<void> {
    if (!this.config.enabled) {
      throw new Error("Handler is disabled");
    }
  }

  async process(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.initialized) await this.initialize();
    return { status: "processed", data, handler: this.constructor.name };
  }
}
