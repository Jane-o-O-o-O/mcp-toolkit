#!/usr/bin/env node
import { createServerContext, startServer } from "./server.js";

const ctx = createServerContext();
ctx.logger.info("Starting Filesystem MCP Server", {
  allowedPaths: ctx.config.allowedPaths,
  maxFileSize: ctx.config.maxFileSize,
});
await startServer(ctx);
