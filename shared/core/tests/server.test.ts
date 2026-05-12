import { describe, it, expect, vi } from "vitest";
import { createMcpServer, startServer } from "../src/server.js";

// Mock the MCP SDK modules
vi.mock("@modelcontextprotocol/sdk/server/index.js", () => ({
  Server: vi.fn().mockImplementation(() => ({
    setRequestHandler: vi.fn(),
    connect: vi.fn(),
  })),
}));

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("@modelcontextprotocol/sdk/types.js", () => ({
  ListToolsRequestSchema: "ListTools",
  CallToolRequestSchema: "CallTool",
}));

describe("createMcpServer", () => {
  it("should create a server and register tools", () => {
    const tools = [
      {
        definition: {
          name: "test_tool",
          description: "A test tool",
          inputSchema: { type: "object" as const, properties: {} },
        },
        handler: vi.fn().mockResolvedValue({ content: [{ type: "text" as const, text: "ok" }] }),
      },
    ];
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const server = createMcpServer("test-server", "1.0.0", tools, logger as any);
    expect(server).toBeDefined();
  });
});

describe("startServer", () => {
  it("should route to stdio transport", async () => {
    const mockServer = {
      connect: vi.fn().mockResolvedValue(undefined),
    };
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    await startServer(
      mockServer as any,
      logger as any,
      "TestServer",
      { transport: "stdio", port: 3000 },
    );

    expect(mockServer.connect).toHaveBeenCalledOnce();
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("TestServer"),
      expect.objectContaining({ transport: "stdio" }),
    );
  });

  it("should throw on unknown transport", async () => {
    const mockServer = {};
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    await expect(
      startServer(
        mockServer as any,
        logger as any,
        "TestServer",
        { transport: "unknown" as any, port: 3000 },
      ),
    ).rejects.toThrow("Unknown transport: unknown");
  });
});
