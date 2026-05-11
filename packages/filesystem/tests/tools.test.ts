import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createFilesystemTools } from "../src/tools/tools.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-fs-test-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("Filesystem tools", () => {
  describe("read_file", () => {
    it("should read a text file", async () => {
      await fs.writeFile(path.join(tmpDir, "hello.txt"), "Hello, World!");
      const tools = createFilesystemTools(tmpDir);
      const readTool = tools.find((t) => t.definition.name === "read_file")!;

      const result = await readTool.handler({ path: "hello.txt" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toBe("Hello, World!");
    });

    it("should handle non-existent files", async () => {
      const tools = createFilesystemTools(tmpDir);
      const readTool = tools.find((t) => t.definition.name === "read_file")!;

      const result = await readTool.handler({ path: "nope.txt" });
      expect(result.isError).toBe(true);
    });

    it("should reject path traversal", async () => {
      const tools = createFilesystemTools(tmpDir);
      const readTool = tools.find((t) => t.definition.name === "read_file")!;

      const result = await readTool.handler({ path: "../../../etc/passwd" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Path traversal");
    });
  });

  describe("write_file", () => {
    it("should write content to a file", async () => {
      const tools = createFilesystemTools(tmpDir);
      const writeTool = tools.find((t) => t.definition.name === "write_file")!;

      const result = await writeTool.handler({ path: "output.txt", content: "test data" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Written");

      const content = await fs.readFile(path.join(tmpDir, "output.txt"), "utf-8");
      expect(content).toBe("test data");
    });

    it("should create parent directories", async () => {
      const tools = createFilesystemTools(tmpDir);
      const writeTool = tools.find((t) => t.definition.name === "write_file")!;

      await writeTool.handler({ path: "a/b/c/deep.txt", content: "nested" });
      const content = await fs.readFile(path.join(tmpDir, "a/b/c/deep.txt"), "utf-8");
      expect(content).toBe("nested");
    });

    it("should reject writes when disabled", async () => {
      const tools = createFilesystemTools(tmpDir, { allowWrite: false });
      const writeTool = tools.find((t) => t.definition.name === "write_file")!;

      const result = await writeTool.handler({ path: "nope.txt", content: "blocked" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("disabled");
    });

    it("should overwrite existing files", async () => {
      await fs.writeFile(path.join(tmpDir, "existing.txt"), "old");
      const tools = createFilesystemTools(tmpDir);
      const writeTool = tools.find((t) => t.definition.name === "write_file")!;

      await writeTool.handler({ path: "existing.txt", content: "new" });
      const content = await fs.readFile(path.join(tmpDir, "existing.txt"), "utf-8");
      expect(content).toBe("new");
    });
  });

  describe("list_directory", () => {
    it("should list files and directories", async () => {
      await fs.writeFile(path.join(tmpDir, "file1.txt"), "a");
      await fs.writeFile(path.join(tmpDir, "file2.txt"), "b");
      await fs.mkdir(path.join(tmpDir, "subdir"));

      const tools = createFilesystemTools(tmpDir);
      const listTool = tools.find((t) => t.definition.name === "list_directory")!;

      const result = await listTool.handler({});
      expect(result.isError).toBeUndefined();
      const text = result.content[0].text;
      expect(text).toContain("file1.txt");
      expect(text).toContain("file2.txt");
      expect(text).toContain("subdir");
    });

    it("should list subdirectory", async () => {
      await fs.mkdir(path.join(tmpDir, "sub"), { recursive: true });
      await fs.writeFile(path.join(tmpDir, "sub", "inner.txt"), "x");

      const tools = createFilesystemTools(tmpDir);
      const listTool = tools.find((t) => t.definition.name === "list_directory")!;

      const result = await listTool.handler({ path: "sub" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("inner.txt");
    });

    it("should support recursive listing", async () => {
      await fs.mkdir(path.join(tmpDir, "a/b"), { recursive: true });
      await fs.writeFile(path.join(tmpDir, "a", "top.txt"), "x");
      await fs.writeFile(path.join(tmpDir, "a", "b", "deep.txt"), "y");

      const tools = createFilesystemTools(tmpDir);
      const listTool = tools.find((t) => t.definition.name === "list_directory")!;

      const result = await listTool.handler({ recursive: true });
      expect(result.isError).toBeUndefined();
      const text = result.content[0].text;
      expect(text).toContain("top.txt");
      expect(text).toContain("deep.txt");
    });
  });

  describe("stat", () => {
    it("should return file metadata", async () => {
      await fs.writeFile(path.join(tmpDir, "info.txt"), "hello");
      const tools = createFilesystemTools(tmpDir);
      const statTool = tools.find((t) => t.definition.name === "stat")!;

      const result = await statTool.handler({ path: "info.txt" });
      expect(result.isError).toBeUndefined();
      const info = JSON.parse(result.content[0].text);
      expect(info.isFile).toBe(true);
      expect(info.size).toBe(5);
    });

    it("should detect directories", async () => {
      await fs.mkdir(path.join(tmpDir, "mydir"));
      const tools = createFilesystemTools(tmpDir);
      const statTool = tools.find((t) => t.definition.name === "stat")!;

      const result = await statTool.handler({ path: "mydir" });
      const info = JSON.parse(result.content[0].text);
      expect(info.isDirectory).toBe(true);
    });
  });

  describe("mkdir", () => {
    it("should create directories", async () => {
      const tools = createFilesystemTools(tmpDir);
      const mkdirTool = tools.find((t) => t.definition.name === "mkdir")!;

      await mkdirTool.handler({ path: "new/nested/dir" });
      const stat = await fs.stat(path.join(tmpDir, "new/nested/dir"));
      expect(stat.isDirectory()).toBe(true);
    });

    it("should reject when writes disabled", async () => {
      const tools = createFilesystemTools(tmpDir, { allowWrite: false });
      const mkdirTool = tools.find((t) => t.definition.name === "mkdir")!;

      const result = await mkdirTool.handler({ path: "blocked" });
      expect(result.isError).toBe(true);
    });
  });

  describe("delete", () => {
    it("should delete a file when enabled", async () => {
      await fs.writeFile(path.join(tmpDir, "doomed.txt"), "bye");
      const tools = createFilesystemTools(tmpDir, { allowDelete: true });
      const deleteTool = tools.find((t) => t.definition.name === "delete")!;

      const result = await deleteTool.handler({ path: "doomed.txt" });
      expect(result.isError).toBeUndefined();
      await expect(fs.access(path.join(tmpDir, "doomed.txt"))).rejects.toThrow();
    });

    it("should reject deletes when disabled (default)", async () => {
      await fs.writeFile(path.join(tmpDir, "safe.txt"), "keep");
      const tools = createFilesystemTools(tmpDir);
      const deleteTool = tools.find((t) => t.definition.name === "delete")!;

      const result = await deleteTool.handler({ path: "safe.txt" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("disabled");
    });

    it("should delete directory recursively", async () => {
      await fs.mkdir(path.join(tmpDir, "tree/a/b"), { recursive: true });
      await fs.writeFile(path.join(tmpDir, "tree", "a", "b", "leaf.txt"), "x");

      const tools = createFilesystemTools(tmpDir, { allowDelete: true });
      const deleteTool = tools.find((t) => t.definition.name === "delete")!;

      await deleteTool.handler({ path: "tree", recursive: true });
      await expect(fs.access(path.join(tmpDir, "tree"))).rejects.toThrow();
    });
  });

  describe("search_files", () => {
    it("should find files matching pattern", async () => {
      await fs.writeFile(path.join(tmpDir, "app.ts"), "x");
      await fs.writeFile(path.join(tmpDir, "lib.ts"), "y");
      await fs.writeFile(path.join(tmpDir, "readme.md"), "z");

      const tools = createFilesystemTools(tmpDir);
      const searchTool = tools.find((t) => t.definition.name === "search_files")!;

      const result = await searchTool.handler({ pattern: "*.ts" });
      expect(result.isError).toBeUndefined();
      const matches = JSON.parse(result.content[0].text);
      expect(matches).toContain("app.ts");
      expect(matches).toContain("lib.ts");
      expect(matches).not.toContain("readme.md");
    });
  });

  describe("tool definitions", () => {
    it("should have 7 tools", () => {
      const tools = createFilesystemTools(tmpDir);
      expect(tools).toHaveLength(7);
    });

    it("each tool should have valid definition", () => {
      const tools = createFilesystemTools(tmpDir);
      for (const tool of tools) {
        expect(tool.definition.name).toBeTruthy();
        expect(tool.definition.description).toBeTruthy();
        expect(tool.definition.inputSchema.type).toBe("object");
      }
    });
  });
});
