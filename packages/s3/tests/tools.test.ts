import { describe, it, expect, vi } from "vitest";
import { createS3Tools } from "../src/tools/index.js";
import type { S3Client } from "../src/tools/types.js";

function mockS3Client(overrides: Partial<S3Client> = {}): S3Client {
  return {
    listBuckets: vi.fn().mockResolvedValue([
      { Name: "my-bucket", CreationDate: "2024-01-01T00:00:00Z" },
      { Name: "data-lake", CreationDate: "2024-06-15T00:00:00Z" },
    ]),
    createBucket: vi.fn().mockResolvedValue(undefined),
    deleteBucket: vi.fn().mockResolvedValue(undefined),
    listObjects: vi.fn().mockResolvedValue([
      { Key: "file1.txt", Size: 1024, LastModified: "2024-01-01T00:00:00Z", ETag: '"abc123"', StorageClass: "STANDARD" },
      { Key: "dir/file2.csv", Size: 2048, LastModified: "2024-06-15T00:00:00Z", ETag: '"def456"', StorageClass: "STANDARD" },
    ]),
    getObject: vi.fn().mockResolvedValue("Hello, World!"),
    putObject: vi.fn().mockResolvedValue(undefined),
    deleteObject: vi.fn().mockResolvedValue(undefined),
    headObject: vi.fn().mockResolvedValue({
      ContentType: "text/plain",
      ContentLength: 1024,
      ETag: '"abc123"',
      LastModified: "2024-01-01T00:00:00Z",
      Metadata: { custom: "value" },
    }),
    ...overrides,
  };
}

describe("S3 tools", () => {
  it("should have 8 tools", () => {
    const tools = createS3Tools(mockS3Client());
    expect(tools).toHaveLength(8);
  });

  describe("list_buckets", () => {
    it("should list all buckets", async () => {
      const client = mockS3Client();
      const tools = createS3Tools(client);
      const tool = tools.find((t) => t.definition.name === "list_buckets")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("my-bucket");
      expect(result.content[0].text).toContain("data-lake");
    });

    it("should show creation dates", async () => {
      const client = mockS3Client();
      const tools = createS3Tools(client);
      const tool = tools.find((t) => t.definition.name === "list_buckets")!;

      const result = await tool.handler({});
      expect(result.content[0].text).toContain("2024-01-01");
    });
  });

  describe("create_bucket", () => {
    it("should create a bucket", async () => {
      const client = mockS3Client();
      const tools = createS3Tools(client);
      const tool = tools.find((t) => t.definition.name === "create_bucket")!;

      const result = await tool.handler({ name: "new-bucket" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("created");
      expect(client.createBucket).toHaveBeenCalledWith("new-bucket");
    });
  });

  describe("delete_bucket", () => {
    it("should delete a bucket", async () => {
      const client = mockS3Client();
      const tools = createS3Tools(client);
      const tool = tools.find((t) => t.definition.name === "delete_bucket")!;

      const result = await tool.handler({ name: "old-bucket" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("deleted");
      expect(client.deleteBucket).toHaveBeenCalledWith("old-bucket");
    });
  });

  describe("list_objects", () => {
    it("should list objects in a bucket", async () => {
      const client = mockS3Client();
      const tools = createS3Tools(client);
      const tool = tools.find((t) => t.definition.name === "list_objects")!;

      const result = await tool.handler({ bucket: "my-bucket" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("file1.txt");
      expect(result.content[0].text).toContain("dir/file2.csv");
      expect(client.listObjects).toHaveBeenCalledWith("my-bucket", undefined, undefined);
    });

    it("should filter by prefix", async () => {
      const client = mockS3Client();
      const tools = createS3Tools(client);
      const tool = tools.find((t) => t.definition.name === "list_objects")!;

      await tool.handler({ bucket: "my-bucket", prefix: "dir/" });
      expect(client.listObjects).toHaveBeenCalledWith("my-bucket", "dir/", undefined);
    });

    it("should limit max keys", async () => {
      const client = mockS3Client();
      const tools = createS3Tools(client);
      const tool = tools.find((t) => t.definition.name === "list_objects")!;

      await tool.handler({ bucket: "my-bucket", maxKeys: 10 });
      expect(client.listObjects).toHaveBeenCalledWith("my-bucket", undefined, 10);
    });

    it("should show object size and storage class", async () => {
      const client = mockS3Client();
      const tools = createS3Tools(client);
      const tool = tools.find((t) => t.definition.name === "list_objects")!;

      const result = await tool.handler({ bucket: "my-bucket" });
      expect(result.content[0].text).toContain("1024");
      expect(result.content[0].text).toContain("STANDARD");
    });
  });

  describe("get_object", () => {
    it("should get object content", async () => {
      const client = mockS3Client();
      const tools = createS3Tools(client);
      const tool = tools.find((t) => t.definition.name === "get_object")!;

      const result = await tool.handler({ bucket: "my-bucket", key: "file1.txt" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toBe("Hello, World!");
      expect(client.getObject).toHaveBeenCalledWith("my-bucket", "file1.txt");
    });
  });

  describe("put_object", () => {
    it("should upload content", async () => {
      const client = mockS3Client();
      const tools = createS3Tools(client);
      const tool = tools.find((t) => t.definition.name === "put_object")!;

      const result = await tool.handler({ bucket: "my-bucket", key: "new.txt", body: "data" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("uploaded");
      expect(client.putObject).toHaveBeenCalledWith("my-bucket", "new.txt", "data", undefined);
    });

    it("should pass content type", async () => {
      const client = mockS3Client();
      const tools = createS3Tools(client);
      const tool = tools.find((t) => t.definition.name === "put_object")!;

      await tool.handler({ bucket: "my-bucket", key: "data.json", body: "{}", contentType: "application/json" });
      expect(client.putObject).toHaveBeenCalledWith("my-bucket", "data.json", "{}", "application/json");
    });
  });

  describe("delete_object", () => {
    it("should delete an object", async () => {
      const client = mockS3Client();
      const tools = createS3Tools(client);
      const tool = tools.find((t) => t.definition.name === "delete_object")!;

      const result = await tool.handler({ bucket: "my-bucket", key: "old.txt" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("deleted");
      expect(client.deleteObject).toHaveBeenCalledWith("my-bucket", "old.txt");
    });
  });

  describe("head_object", () => {
    it("should return object metadata", async () => {
      const client = mockS3Client();
      const tools = createS3Tools(client);
      const tool = tools.find((t) => t.definition.name === "head_object")!;

      const result = await tool.handler({ bucket: "my-bucket", key: "file1.txt" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("text/plain");
      expect(result.content[0].text).toContain("1024");
      expect(result.content[0].text).toContain("abc123");
    });

    it("should show custom metadata", async () => {
      const client = mockS3Client();
      const tools = createS3Tools(client);
      const tool = tools.find((t) => t.definition.name === "head_object")!;

      const result = await tool.handler({ bucket: "my-bucket", key: "file1.txt" });
      expect(result.content[0].text).toContain("custom");
      expect(result.content[0].text).toContain("value");
    });
  });

  describe("error handling", () => {
    it("should return error on bucket list failure", async () => {
      const client = mockS3Client({
        listBuckets: vi.fn().mockRejectedValue(new Error("Access Denied")),
      });
      const tools = createS3Tools(client);
      const tool = tools.find((t) => t.definition.name === "list_buckets")!;

      const result = await tool.handler({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Access Denied");
    });

    it("should return error on object not found", async () => {
      const client = mockS3Client({
        getObject: vi.fn().mockRejectedValue(new Error("NoSuchKey")),
      });
      const tools = createS3Tools(client);
      const tool = tools.find((t) => t.definition.name === "get_object")!;

      const result = await tool.handler({ bucket: "my-bucket", key: "missing.txt" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("NoSuchKey");
    });

    it("should return error on delete non-empty bucket", async () => {
      const client = mockS3Client({
        deleteBucket: vi.fn().mockRejectedValue(new Error("BucketNotEmpty")),
      });
      const tools = createS3Tools(client);
      const tool = tools.find((t) => t.definition.name === "delete_bucket")!;

      const result = await tool.handler({ name: "my-bucket" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("BucketNotEmpty");
    });
  });
});
