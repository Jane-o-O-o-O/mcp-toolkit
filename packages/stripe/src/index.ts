#!/usr/bin/env node
import { createServerContext, startServer } from "./server.js";

process.on("SIGINT", () => {
  process.exit(0);
});

process.on("SIGTERM", () => {
  process.exit(0);
});

async function main() {
  const ctx = await createServerContext();
  await startServer(ctx);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
