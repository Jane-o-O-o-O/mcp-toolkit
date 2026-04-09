#!/usr/bin/env node
import { createServerContext, startServer } from "./server.js";

async function main(): Promise<void> {
  let ctx;
  try {
    ctx = await createServerContext();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to start: ${message}`);
    process.exit(1);
  }

  const shutdown = async () => {
    ctx.logger.info("Shutting down...");
    await ctx.server.close();
    await ctx.mongo.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await startServer(ctx);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});

// [2026-04-09] Fix: stale cache reference in index
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
