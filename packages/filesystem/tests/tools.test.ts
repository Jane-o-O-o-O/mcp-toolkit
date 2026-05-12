import { describe, it, expect, beforeEach } from "vitest";
import { createFilesystemTools } from "../src/tools/tools.js";
import type { FileSystem, PathUtils } from "../src/tools/types.js";

/** In-memory mock filesystem for testing. */
function createMockFs(): FileSystem {
  const files = new Map<string, string>();
  const dirs = new Set<string>(["/workspace"]);

  function normPath(p: string): string {
    // Normalize: remove trailing slashes, collapse double slashes
    return p.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
  }

  return {
    async readFile(p: string, encoding?: "utf-8") {
      const np = normPath(p);
      if (!files.has(np)) throw new Error(`ENOENT: no such file or directory, '${p}'`);
      return files.get(np)!;
    },
    async writeFile(p: string, data: string | Buffer) {
      const content = typeof data === "string" ? data : data.toString();
      files.set(normPath(p), content);
    },
    async appendFile(p: string, data: string) {
      const np = normPath(p);
      const existing = files.get(np) ?? "";
      files.set(np, existing + data);
    },
    async unlink(p: string) {
      const np = normPath(p);
      if (!files.has(np)) throw new Error(`ENOENT: no such file or directory, '${p}'`);
      files.delete(np);
    },
    async mkdir(p: string, opts?: { recursive?: boolean }) {
      dirs.add(normPath(p));
    },
    async rmdir(p: string, opts?: { recursive?: boolean }) {
      const np = normPath(p);
      if (!dirs.has(np)) throw new Error(`ENOTDIR: not a directory, '${p}'`);
      if (opts?.recursive) {
        for (const [fp] of files) {
          if (fp.startsWith(np + "/")) files.delete(fp);
        }
        for (const d of dirs) {
          if (d.startsWith(np + "/")) dirs.delete(d);
        }
      }
      dirs.delete(np);
    },
    async readdir(p: string) {
      const np = normPath(p);
      if (!dirs.has(np)) throw new Error(`ENOTDIR: not a directory, '${p}'`);
      const entries: string[] = [];
      const prefix = np + "/";
      for (const fp of files.keys()) {
        if (fp.startsWith(prefix)) {
          const rest = fp.slice(prefix.length);
          if (!rest.includes("/")) entries.push(rest);
        }
      }
      for (const d of dirs) {
        if (d !== np && d.startsWith(prefix)) {
          const rest = d.slice(prefix.length);
          if (!rest.includes("/")) entries.push(rest);
        }
      }
      return entries;
    },
    async stat(p: string) {
      const np = normPath(p);
      if (files.has(np)) {
        const content = files.get(np)!;
        return {
          size: Buffer.byteLength(content),
          isFile: () => true,
          isDirectory: () => false,
          mtime: new Date(),
          birthtime: new Date(),
          mode: 0o644,
        };
      }
      if (dirs.has(np)) {
        return {
          size: 0,
          isFile: () => false,
          isDirectory: () => true,
          mtime: new Date(),
          birthtime: new Date(),
          mode: 0o755,
        };
      }
      throw new Error(`ENOENT: no such file or directory, '${p}'`);
    },
    async access(p: string) {
      const np = normPath(p);
      if (!files.has(np) && !dirs.has(np)) throw new Error(`ENOENT: '${p}'`);
    },
    async realpath(p: string) {
      return normPath(p);
    },
  };
}

const mockPath: PathUtils = {
  join: (...parts: string[]) => parts.join("/").replace(/\/+/g, "/"),
  resolve: (...parts: string[]) => {
    const joined = parts.join("/").replace(/\/+/g, "/");
    return joined.startsWith("/") ? joined : "/" + joined;
  },
  dirname: (p: string) => p.split("/").slice(0, -1).join("/") || "/",
  basename: (p: string) => p.split("/").pop() ?? "",
  extname: (p: string) => {
    const base = p.split("/").pop() ?? "";
    const dot = base.lastIndexOf(".");
    return dot > 0 ? base.slice(dot) : "";
  },
  normalize: (p: string) => p.replace(/\/+/g, "/").replace(/\/$/, "") || "/",
};

const ALLOWED_PATHS = ["/workspace"];
const MAX_FILE_SIZE = 1024 * 1024;

describe("Filesystem Tools", () => {
  let fs: ReturnType<typeof createMockFs>;

  beforeEach(() => {
    fs = createMockFs();
  });

  function getTools() {
    return createFilesystemTools(fs, mockPath, ALLOWED_PATHS, MAX_FILE_SIZE);
  }

  function findTool(name: string) {
    const tools = getTools();
    const tool = tools.find((t) => t.definition.name === name);
    if (!tool) throw new Error(`Tool '${name}' not found`);
    return tool;
  }

  describe("read_file", () => {
    it("should read file content", async () => {
      await fs.writeFile("/workspace/test.txt", "hello world");
      const tool = findTool("read_file");
      const result = await tool.handler({ path: "/workspace/test.txt" });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toBe("hello world");
    });

    it("should support offset and limit for line reading", async () => {
      await fs.writeFile("/workspace/lines.txt", "line1\nline2\nline3\nline4\nline5");
      const tool = findTool("read_file");
      const result = await tool.handler({ path: "/workspace/lines.txt", offset: 1, limit: 2 });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toBe("line2\nline3");
    });

    it("should error on non-existent file", async () => {
      const tool = findTool("read_file");
      const result = await tool.handler({ path: "/workspace/nonexistent.txt" });
      expect(result.isError).toBe(true);
    });

    it("should error on path outside allowed paths", async () => {
      const tool = findTool("read_file");
      const result = await tool.handler({ path: "/etc/passwd" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Access denied");
    });

    it("should error when reading a directory", async () => {
      const tool = findTool("read_file");
      const result = await tool.handler({ path: "/workspace" });
      expect(result.isError).toBe(true);
    });
  });

  describe("write_file", () => {
    it("should create a new file", async () => {
      const tool = findTool("write_file");
      const result = await tool.handler({ path: "/workspace/new.txt", content: "new content" });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain("Wrote");

      const readTool = findTool("read_file");
      const readResult = await readTool.handler({ path: "/workspace/new.txt" });
      expect(readResult.content[0].text).toBe("new content");
    });

    it("should overwrite existing file", async () => {
      await fs.writeFile("/workspace/exists.txt", "old");
      const tool = findTool("write_file");
      await tool.handler({ path: "/workspace/exists.txt", content: "new" });

      const readTool = findTool("read_file");
      const readResult = await readTool.handler({ path: "/workspace/exists.txt" });
      expect(readResult.content[0].text).toBe("new");
    });

    it("should create parent directories automatically", async () => {
      const tool = findTool("write_file");
      const result = await tool.handler({
        path: "/workspace/deep/nested/file.txt",
        content: "deep content",
      });
      expect(result.isError).toBeFalsy();
    });
  });

  describe("append_file", () => {
    it("should append to existing file", async () => {
      await fs.writeFile("/workspace/log.txt", "line1\n");
      const tool = findTool("append_file");
      await tool.handler({ path: "/workspace/log.txt", content: "line2\n" });

      const readTool = findTool("read_file");
      const readResult = await readTool.handler({ path: "/workspace/log.txt" });
      expect(readResult.content[0].text).toBe("line1\nline2\n");
    });

    it("should create file if it doesn't exist", async () => {
      const tool = findTool("append_file");
      await tool.handler({ path: "/workspace/new-log.txt", content: "first line\n" });

      const readTool = findTool("read_file");
      const readResult = await readTool.handler({ path: "/workspace/new-log.txt" });
      expect(readResult.content[0].text).toBe("first line\n");
    });
  });

  describe("list_directory", () => {
    it("should list directory contents", async () => {
      await fs.writeFile("/workspace/a.txt", "a");
      await fs.writeFile("/workspace/b.txt", "b");
      await fs.mkdir("/workspace/subdir");

      const tool = findTool("list_directory");
      const result = await tool.handler({ path: "/workspace" });
      expect(result.isError).toBeFalsy();
      const text = result.content[0].text;
      expect(text).toContain("a.txt");
      expect(text).toContain("b.txt");
    });

    it("should list recursively when requested", async () => {
      await fs.writeFile("/workspace/a.txt", "a");
      await fs.mkdir("/workspace/sub");
      await fs.writeFile("/workspace/sub/b.txt", "b");

      const tool = findTool("list_directory");
      const result = await tool.handler({ path: "/workspace", recursive: true });
      const text = result.content[0].text;
      expect(text).toContain("a.txt");
      expect(text).toContain("sub/b.txt");
    });
  });

  describe("create_directory", () => {
    it("should create a directory", async () => {
      const tool = findTool("create_directory");
      const result = await tool.handler({ path: "/workspace/newdir" });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain("Created directory");
    });
  });

  describe("delete_path", () => {
    it("should delete a file", async () => {
      await fs.writeFile("/workspace/deleteme.txt", "bye");
      const tool = findTool("delete_path");
      const result = await tool.handler({ path: "/workspace/deleteme.txt" });
      expect(result.isError).toBeFalsy();

      const readTool = findTool("read_file");
      const readResult = await readTool.handler({ path: "/workspace/deleteme.txt" });
      expect(readResult.isError).toBe(true);
    });
  });

  describe("file_info", () => {
    it("should return file metadata", async () => {
      await fs.writeFile("/workspace/meta.txt", "some content here");
      const tool = findTool("file_info");
      const result = await tool.handler({ path: "/workspace/meta.txt" });
      expect(result.isError).toBeFalsy();
      const info = JSON.parse(result.content[0].text);
      expect(info.type).toBe("file");
      expect(info.path).toBe("/workspace/meta.txt");
      expect(info.extension).toBe(".txt");
      expect(info.size).toBeGreaterThan(0);
    });

    it("should identify directories", async () => {
      const tool = findTool("file_info");
      const result = await tool.handler({ path: "/workspace" });
      expect(result.isError).toBeFalsy();
      const info = JSON.parse(result.content[0].text);
      expect(info.type).toBe("directory");
    });
  });

  describe("search_files", () => {
    it("should find files matching pattern", async () => {
      await fs.writeFile("/workspace/test.ts", "ts file");
      await fs.writeFile("/workspace/test.js", "js file");
      await fs.writeFile("/workspace/readme.md", "readme");
      await fs.mkdir("/workspace/sub");
      await fs.writeFile("/workspace/sub/nested.ts", "nested ts");

      const tool = findTool("search_files");
      const result = await tool.handler({ path: "/workspace", pattern: "*.ts" });
      expect(result.isError).toBeFalsy();
      const text = result.content[0].text;
      expect(text).toContain("test.ts");
      expect(text).not.toContain("test.js");
    });

    it("should support ** glob patterns for recursive matching", async () => {
      await fs.mkdir("/workspace/sub");
      await fs.writeFile("/workspace/sub/nested.json", "{}");
      await fs.writeFile("/workspace/top.json", "{}");

      const tool = findTool("search_files");
      const result = await tool.handler({ path: "/workspace", pattern: "**/*.json" });
      const text = result.content[0].text;
      expect(text).toContain("top.json");
      expect(text).toContain("sub/nested.json");
    });

    it("should respect maxResults", async () => {
      for (let i = 0; i < 10; i++) {
        await fs.writeFile(`/workspace/file${i}.txt`, `content ${i}`);
      }
      const tool = findTool("search_files");
      const result = await tool.handler({ path: "/workspace", pattern: "*.txt", maxResults: 3 });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.length).toBeLessThanOrEqual(3);
    });
  });

  describe("path security", () => {
    it("should block access to parent directories", async () => {
      const tool = findTool("read_file");
      const result = await tool.handler({ path: "/workspace/../etc/passwd" });
      expect(result.isError).toBe(true);
    });

    it("should block absolute paths outside allowed", async () => {
      const tool = findTool("write_file");
      const result = await tool.handler({ path: "/tmp/evil.txt", content: "hack" });
      expect(result.isError).toBe(true);
    });
  });
});
