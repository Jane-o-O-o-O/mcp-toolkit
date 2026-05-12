import type { FileSystem, PathUtils } from "./types.js";
import { safeRun, type McpTool } from "@mcp-toolkit/base";

/** Path security check: ensure the resolved path is within an allowed directory. */
function assertAllowed(
  resolvedPath: string,
  allowedPaths: string[],
  pathUtil: PathUtils,
): void {
  const normalized = pathUtil.normalize(resolvedPath);
  const isAllowed = allowedPaths.some((allowed) => {
    const normAllowed = pathUtil.normalize(allowed);
    return normalized === normAllowed || normalized.startsWith(normAllowed + "/");
  });
  if (!isAllowed) {
    throw new Error(
      `Access denied: '${resolvedPath}' is not within allowed paths [${allowedPaths.join(", ")}]`,
    );
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function createFilesystemTools(
  fs: FileSystem,
  pathUtil: PathUtils,
  allowedPaths: string[],
  maxFileSize: number,
): McpTool[] {
  function resolveAndCheck(inputPath: string): string {
    const resolved = pathUtil.resolve(inputPath);
    assertAllowed(resolved, allowedPaths, pathUtil);
    return resolved;
  }

  const readFileTool: McpTool = {
    definition: {
      name: "read_file",
      description:
        "Read the contents of a file. Returns the file text. For binary files or files exceeding the size limit, returns file metadata instead.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path to read" },
          offset: {
            type: "number",
            description: "Line number to start reading from (0-indexed, optional)",
          },
          limit: {
            type: "number",
            description: "Maximum number of lines to read (optional, default: all)",
          },
        },
        required: ["path"],
      },
    },
    handler: async (args) => {
      return safeRun(async () => {
        const filePath = resolveAndCheck(args.path as string);
        const stat = await fs.stat(filePath);
        if (!stat.isFile()) {
          throw new Error(`'${args.path}' is not a file`);
        }
        if (stat.size > maxFileSize) {
          return `File too large (${formatSize(stat.size)}). Max allowed: ${formatSize(maxFileSize)}. Use offset/limit to read a portion.`;
        }
        const content = await fs.readFile(filePath, "utf-8");
        const offset = args.offset as number | undefined;
        const limit = args.limit as number | undefined;
        if (offset !== undefined || limit !== undefined) {
          const lines = content.split("\n");
          const start = offset ?? 0;
          const end = limit !== undefined ? start + limit : lines.length;
          return lines.slice(start, end).join("\n");
        }
        return content;
      });
    },
  };

  const writeFileTool: McpTool = {
    definition: {
      name: "write_file",
      description:
        "Write content to a file. Creates the file if it doesn't exist, overwrites if it does. Parent directories are created automatically.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path to write" },
          content: { type: "string", description: "Content to write to the file" },
        },
        required: ["path", "content"],
      },
    },
    handler: async (args) => {
      return safeRun(async () => {
        const filePath = resolveAndCheck(args.path as string);
        const content = args.content as string;
        // Ensure parent directory exists
        const dir = pathUtil.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, content);
        return `Wrote ${formatSize(Buffer.byteLength(content))} to ${args.path}`;
      });
    },
  };

  const appendFileTool: McpTool = {
    definition: {
      name: "append_file",
      description: "Append content to the end of a file. Creates the file if it doesn't exist.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path to append to" },
          content: { type: "string", description: "Content to append" },
        },
        required: ["path", "content"],
      },
    },
    handler: async (args) => {
      return safeRun(async () => {
        const filePath = resolveAndCheck(args.path as string);
        const dir = pathUtil.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.appendFile(filePath, args.content as string);
        return `Appended ${formatSize(Buffer.byteLength(args.content as string))} to ${args.path}`;
      });
    },
  };

  const listDirectoryTool: McpTool = {
    definition: {
      name: "list_directory",
      description:
        "List files and directories in a path. Returns an array of entries with type indicators (file/directory).",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Directory path to list" },
          recursive: {
            type: "boolean",
            description: "Whether to list recursively (default: false)",
          },
        },
        required: ["path"],
      },
    },
    handler: async (args) => {
      return safeRun(async () => {
        const dirPath = resolveAndCheck(args.path as string);
        const recursive = (args.recursive as boolean) ?? false;

        async function listDir(dir: string, prefix: string): Promise<string[]> {
          const entries = await fs.readdir(dir);
          const results: string[] = [];
          for (const entry of entries.sort()) {
            const fullPath = pathUtil.join(dir, entry);
            const stat = await fs.stat(fullPath);
            const displayPath = prefix ? `${prefix}/${entry}` : entry;
            if (stat.isDirectory()) {
              results.push(`${displayPath}/`);
              if (recursive) {
                const subEntries = await listDir(fullPath, displayPath);
                results.push(...subEntries);
              }
            } else {
              results.push(displayPath);
            }
          }
          return results;
        }

        const entries = await listDir(dirPath, "");
        return entries;
      });
    },
  };

  const createDirectoryTool: McpTool = {
    definition: {
      name: "create_directory",
      description: "Create a directory. Creates parent directories as needed (like mkdir -p).",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Directory path to create" },
        },
        required: ["path"],
      },
    },
    handler: async (args) => {
      return safeRun(async () => {
        const dirPath = resolveAndCheck(args.path as string);
        await fs.mkdir(dirPath, { recursive: true });
        return `Created directory: ${args.path}`;
      });
    },
  };

  const deletePathTool: McpTool = {
    definition: {
      name: "delete_path",
      description:
        "Delete a file or directory. For directories, use recursive=true to delete non-empty directories.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to delete" },
          recursive: {
            type: "boolean",
            description: "For directories: delete recursively (default: false)",
          },
        },
        required: ["path"],
      },
    },
    handler: async (args) => {
      return safeRun(async () => {
        const targetPath = resolveAndCheck(args.path as string);
        const recursive = (args.recursive as boolean) ?? false;
        const stat = await fs.stat(targetPath);
        if (stat.isDirectory()) {
          await fs.rmdir(targetPath, { recursive });
        } else {
          await fs.unlink(targetPath);
        }
        return `Deleted: ${args.path}`;
      });
    },
  };

  const fileInfoTool: McpTool = {
    definition: {
      name: "file_info",
      description:
        "Get metadata about a file or directory — size, type, timestamps, permissions.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to inspect" },
        },
        required: ["path"],
      },
    },
    handler: async (args) => {
      return safeRun(async () => {
        const targetPath = resolveAndCheck(args.path as string);
        const stat = await fs.stat(targetPath);
        const type = stat.isDirectory() ? "directory" : "file";
        const ext = type === "file" ? pathUtil.extname(targetPath) : undefined;
        return {
          path: args.path,
          type,
          size: stat.size,
          sizeHuman: formatSize(stat.size),
          ...(ext ? { extension: ext } : {}),
          modified: stat.mtime.toISOString(),
          created: stat.birthtime.toISOString(),
          mode: `0${(stat.mode & 0o777).toString(8)}`,
        };
      });
    },
  };

  const searchFilesTool: McpTool = {
    definition: {
      name: "search_files",
      description:
        "Search for files matching a glob pattern within a directory. Returns matching file paths.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Directory to search in" },
          pattern: {
            type: "string",
            description: "Glob pattern to match (e.g., '*.ts', '**/*.json')",
          },
          maxResults: {
            type: "number",
            description: "Maximum number of results (default: 100)",
          },
        },
        required: ["path", "pattern"],
      },
    },
    handler: async (args) => {
      return safeRun(async () => {
        const basePath = resolveAndCheck(args.path as string);
        const pattern = args.pattern as string;
        const maxResults = (args.maxResults as number) ?? 100;
        const results: string[] = [];

        // Simple glob matching: support * and **
        // Use placeholder to prevent ** replacement from being caught by * step
        const STAR = "\x00";
        const regexStr = pattern
          .replace(/\./g, "\\.")
          .replace(/\*\*/g, STAR)
          .replace(/\*/g, "[^/]*")
          .replace(/\?/g, ".")
          .replace(new RegExp(`${STAR}/`, "g"), "(.*/)?")
          .replace(new RegExp(STAR, "g"), ".*");
        const regex = new RegExp(`^${regexStr}$`);

        async function searchDir(dir: string, relPrefix: string): Promise<void> {
          if (results.length >= maxResults) return;
          const entries = await fs.readdir(dir);
          for (const entry of entries) {
            if (results.length >= maxResults) break;
            // Skip hidden directories and node_modules
            if (entry.startsWith(".") || entry === "node_modules") continue;
            const fullPath = pathUtil.join(dir, entry);
            const relPath = relPrefix ? `${relPrefix}/${entry}` : entry;
            const stat = await fs.stat(fullPath);
            if (stat.isDirectory()) {
              await searchDir(fullPath, relPath);
            } else if (regex.test(relPath) || regex.test(entry)) {
              results.push(relPath);
            }
          }
        }

        await searchDir(basePath, "");
        return results.slice(0, maxResults);
      });
    },
  };

  return [
    readFileTool,
    writeFileTool,
    appendFileTool,
    listDirectoryTool,
    createDirectoryTool,
    deletePathTool,
    fileInfoTool,
    searchFilesTool,
  ];
}
