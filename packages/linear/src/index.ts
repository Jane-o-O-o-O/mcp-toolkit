#!/usr/bin/env node
import { createServerContext, startServer } from "./server.js";

async function main() {
  const ctx = await createServerContext();
  await startServer(ctx);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
