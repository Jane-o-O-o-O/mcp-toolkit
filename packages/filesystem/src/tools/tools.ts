import fs from "node:fs/promises";
import path from "node:path";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun, errorResult } from "@mcp-toolkit/core";

/** Resolve and validate a path is within the root directory */
function safePath(rootDir: string, filePath: string): string {
  const resolved = path.resolve(rootDir, filePath);
  if (!resolved.startsWith(path.resolve(rootDir))) {
    throw new Error(`Path traversal detected: ${filePath} is outside root directory`);
  }
  return resolved;
}


export function createFilesystemTools(
  rootDir: string,
  options: { allowWrite?: boolean; allowDelete?: boolean; maxFileSize?: number } = {},
): McpTool[] {
  const { allowWrite = true, allowDelete = false, maxFileSize = 10 * 1024 * 1024 } = options;

  const readFileTool: McpTool = {
    definition: {
      name: "read_file",
      description: "Read the contents of a text file. Returns the file content as a string.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path relative to root directory" },
          encoding: { type: "string", description: "File encoding (default: utf-8)" },
        },
        required: ["path"],
      },
    },
    handler: async (args) => {
      return safeRun(async () => {
        const fullPath = safePath(rootDir, args.path as string);
        const stat = await fs.stat(fullPath);
        if (stat.size > maxFileSize) {
          throw new Error(`File size (${stat.size}) exceeds maximum allowed size (${maxFileSize})`);
        }
        const encoding = (args.encoding as BufferEncoding) ?? "utf-8";
        return await fs.readFile(fullPath, { encoding });
      });
    },
  };

  const writeFileTool: McpTool = {
    definition: {
      name: "write_file",
      description: "Write content to a file. Creates parent directories if needed. Overwrites existing files.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path relative to root directory" },
          content: { type: "string", description: "Content to write" },
          encoding: { type: "string", description: "File encoding (default: utf-8)" },
        },
        required: ["path", "content"],
      },
    },
    handler: async (args) => {
      if (!allowWrite) return errorResult("Write operations are disabled");
      return safeRun(async () => {
        const fullPath = safePath(rootDir, args.path as string);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        const encoding = (args.encoding as BufferEncoding) ?? "utf-8";
        await fs.writeFile(fullPath, args.content as string, { encoding });
        return `Written ${Buffer.byteLength(args.content as string, encoding)} bytes to ${args.path}`;
      });
    },
  };

  const listDirTool: McpTool = {
    definition: {
      name: "list_directory",
      description: "List files and directories at a path. Returns names with type indicators (file/dir).",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Directory path relative to root (default: root)" },
          recursive: { type: "boolean", description: "List recursively (default: false)" },
        },
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const dirPath = safePath(rootDir, (args.path as string) ?? ".");
          const recursive = (args.recursive as boolean) ?? false;

          if (recursive) {
            const entries: string[] = [];
            async function walk(dir: string, prefix: string) {
              const items = await fs.readdir(dir, { withFileTypes: true });
              for (const item of items) {
                const relPath = prefix ? `${prefix}/${item.name}` : item.name;
                if (item.isDirectory()) {
                  entries.push(`${relPath}/`);
                  await walk(path.join(dir, item.name), relPath);
                } else {
                  entries.push(relPath);
                }
              }
            }
            await walk(dirPath, (args.path as string) ?? "");
            return entries;
          }

          const items = await fs.readdir(dirPath, { withFileTypes: true });
          return items.map((item) => ({
            name: item.name,
            type: item.isDirectory() ? "directory" : "file",
          }));
        },
        (result) => JSON.stringify(result, null, 2),
      );
    },
  };

  const statTool: McpTool = {
    definition: {
      name: "stat",
      description: "Get file/directory metadata (size, timestamps, type, permissions).",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "File or directory path relative to root" },
        },
        required: ["path"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const fullPath = safePath(rootDir, args.path as string);
          const stat = await fs.stat(fullPath);
          return {
            size: stat.size,
            isFile: stat.isFile(),
            isDirectory: stat.isDirectory(),
            created: stat.birthtime.toISOString(),
            modified: stat.mtime.toISOString(),
            permissions: stat.mode.toString(8),
          };
        },
        (info) => JSON.stringify(info, null, 2),
      );
    },
  };

  const mkdirTool: McpTool = {
    definition: {
      name: "mkdir",
      description: "Create a directory (and any parent directories that don't exist).",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Directory path relative to root" },
        },
        required: ["path"],
      },
    },
    handler: async (args) => {
      if (!allowWrite) return errorResult("Write operations are disabled");
      return safeRun(async () => {
        const fullPath = safePath(rootDir, args.path as string);
        await fs.mkdir(fullPath, { recursive: true });
        return `Created directory: ${args.path}`;
      });
    },
  };

  const deleteTool: McpTool = {
    definition: {
      name: "delete",
      description: "Delete a file or directory. Requires MCP_FILESYSTEM_ALLOW_DELETE=true.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "File or directory path relative to root" },
          recursive: { type: "boolean", description: "Delete directories recursively (default: false)" },
        },
        required: ["path"],
      },
    },
    handler: async (args) => {
      if (!allowDelete) return errorResult("Delete operations are disabled. Set MCP_FILESYSTEM_ALLOW_DELETE=true to enable.");
      return safeRun(async () => {
        const fullPath = safePath(rootDir, args.path as string);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          await fs.rm(fullPath, { recursive: (args.recursive as boolean) ?? false });
          return `Deleted directory: ${args.path}`;
        }
        await fs.unlink(fullPath);
        return `Deleted file: ${args.path}`;
      });
    },
  };

  const searchTool: McpTool = {
    definition: {
      name: "search_files",
      description: "Search for files matching a glob pattern within a directory.",
      inputSchema: {
        type: "object",
        properties: {
          pattern: { type: "string", description: "Glob pattern (e.g. '*.ts', '**/*.json')" },
          path: { type: "string", description: "Directory to search in (default: root)" },
        },
        required: ["pattern"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const searchDir = safePath(rootDir, (args.path as string) ?? ".");
          const pattern = args.pattern as string;

          // Simple glob matching using fs.glob (Node 22+) or manual walk
          const matches: string[] = [];
          const regex = new RegExp(
            "^" +
              pattern
                .replace(/\./g, "\\.")
                .replace(/\*\*/g, "⟨GLOBSTAR⟩")
                .replace(/\*/g, "[^/]*")
                .replace(/⟨GLOBSTAR⟩/g, ".*")
                .replace(/\?/g, ".") +
              "$",
          );

          async function walk(dir: string, relPrefix: string) {
            const items = await fs.readdir(dir, { withFileTypes: true });
            for (const item of items) {
              const relPath = relPrefix ? `${relPrefix}/${item.name}` : item.name;
              if (item.name.startsWith(".") && !pattern.startsWith(".")) continue;
              if (item.isDirectory()) {
                if (pattern.includes("**")) {
                  if (regex.test(relPath)) matches.push(relPath + "/");
                }
                await walk(path.join(dir, item.name), relPath);
              } else {
                if (regex.test(relPath) || regex.test(item.name)) {
                  matches.push(relPath);
                }
              }
            }
          }

          await walk(searchDir, "");
          return matches;
        },
        (result) => JSON.stringify(result, null, 2),
      );
    },
  };

  return [readFileTool, writeFileTool, listDirTool, statTool, mkdirTool, deleteTool, searchTool];
}
