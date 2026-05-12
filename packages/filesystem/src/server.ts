import { createServer, startServer, type ServerContext } from "@mcp-toolkit/base";
import { createLogger } from "@mcp-toolkit/logger";
import { loadConfig, type FilesystemConfig } from "./config.js";
import { createFilesystemTools } from "./tools/index.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { FileSystem, PathUtils } from "./tools/types.js";

/** Real Node.js filesystem implementation. */
const nodeFs: FileSystem = {
  readFile: ((p: string, encoding?: "utf-8") => {
    if (encoding) return fs.readFile(p, encoding);
    return fs.readFile(p) as Promise<Buffer>;
  }) as FileSystem["readFile"],
  writeFile: (p, data) => fs.writeFile(p, data) as Promise<void>,
  appendFile: (p, data) => fs.appendFile(p, data) as Promise<void>,
  unlink: (p) => fs.unlink(p),
  mkdir: (p, opts) => fs.mkdir(p, opts) as Promise<void>,
  rmdir: (p, opts) => fs.rmdir(p, opts) as Promise<void>,
  readdir: (p) => fs.readdir(p),
  stat: async (p) => {
    const s = await fs.stat(p);
    return {
      size: s.size,
      isFile: () => s.isFile(),
      isDirectory: () => s.isDirectory(),
      mtime: s.mtime,
      birthtime: s.birthtime,
      mode: s.mode,
    };
  },
  access: (p) => fs.access(p),
  realpath: (p) => fs.realpath(p),
};

const nodePath: PathUtils = {
  join: (...args: string[]) => path.join(...args),
  resolve: (...args: string[]) => path.resolve(...args),
  dirname: (p: string) => path.dirname(p),
  basename: (p: string) => path.basename(p),
  extname: (p: string) => path.extname(p),
  normalize: (p: string) => path.normalize(p),
};

export interface FilesystemServerContext extends ServerContext {
  config: FilesystemConfig;
}

export function createServerContext(config?: Partial<FilesystemConfig>): FilesystemServerContext {
  const fullConfig = config?.allowedPaths
    ? {
        allowedPaths: config.allowedPaths,
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
        maxFileSize: config.maxFileSize ?? 10 * 1024 * 1024,
      }
    : loadConfig();

  const logger = createLogger({
    name: "filesystem",
    level: fullConfig.logLevel,
  });

  const tools = createFilesystemTools(nodeFs, nodePath, fullConfig.allowedPaths, fullConfig.maxFileSize);

  const ctx = createServer({
    name: "@mcp-toolkit/filesystem",
    version: "0.1.0",
    tools,
    logger,
  });

  return { ...ctx, config: fullConfig };
}

export { startServer };
