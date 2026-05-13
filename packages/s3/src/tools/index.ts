import type { S3Client } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createS3Tools(s3: S3Client): McpTool[] {
  const listBucketsTool: McpTool = {
    definition: {
      name: "list_buckets",
      description: "List all S3 buckets.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () => {
      return safeRun(
        async () => {
          const buckets = await s3.listBuckets();
          return buckets.map((b) => ({
            name: b.Name,
            created: b.CreationDate,
          }));
        },
        (rows) => JSON.stringify(rows, null, 2),
      );
    },
  };

  const createBucketTool: McpTool = {
    definition: {
      name: "create_bucket",
      description: "Create a new S3 bucket.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Bucket name" },
        },
        required: ["name"],
      },
    },
    handler: async (args) => {
      return safeRun(async () => {
        await s3.createBucket(args.name as string);
        return `Bucket "${args.name}" created`;
      });
    },
  };

  const deleteBucketTool: McpTool = {
    definition: {
      name: "delete_bucket",
      description: "Delete an S3 bucket. Must be empty.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Bucket name" },
        },
        required: ["name"],
      },
    },
    handler: async (args) => {
      return safeRun(async () => {
        await s3.deleteBucket(args.name as string);
        return `Bucket "${args.name}" deleted`;
      });
    },
  };

  const listObjectsTool: McpTool = {
    definition: {
      name: "list_objects",
      description: "List objects in an S3 bucket with optional prefix filter.",
      inputSchema: {
        type: "object",
        properties: {
          bucket: { type: "string", description: "Bucket name" },
          prefix: { type: "string", description: "Filter by key prefix" },
          maxKeys: { type: "number", description: "Max objects to return (default: 1000)" },
        },
        required: ["bucket"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const objects = await s3.listObjects(
            args.bucket as string,
            args.prefix as string | undefined,
            args.maxKeys as number | undefined,
          );
          return objects.map((o) => ({
            key: o.Key,
            size: o.Size,
            lastModified: o.LastModified,
            etag: o.ETag,
            storageClass: o.StorageClass,
          }));
        },
        (rows) => JSON.stringify(rows, null, 2),
      );
    },
  };

  const getObjectTool: McpTool = {
    definition: {
      name: "get_object",
      description: "Get the content of an S3 object as text.",
      inputSchema: {
        type: "object",
        properties: {
          bucket: { type: "string", description: "Bucket name" },
          key: { type: "string", description: "Object key" },
        },
        required: ["bucket", "key"],
      },
    },
    handler: async (args) => {
      return safeRun(async () => {
        return await s3.getObject(args.bucket as string, args.key as string);
      });
    },
  };

  const putObjectTool: McpTool = {
    definition: {
      name: "put_object",
      description: "Upload content to an S3 object.",
      inputSchema: {
        type: "object",
        properties: {
          bucket: { type: "string", description: "Bucket name" },
          key: { type: "string", description: "Object key" },
          body: { type: "string", description: "Content to upload" },
          contentType: { type: "string", description: "MIME type (default: text/plain)" },
        },
        required: ["bucket", "key", "body"],
      },
    },
    handler: async (args) => {
      return safeRun(async () => {
        await s3.putObject(
          args.bucket as string,
          args.key as string,
          args.body as string,
          args.contentType as string | undefined,
        );
        return `Object "${args.key}" uploaded to bucket "${args.bucket}"`;
      });
    },
  };

  const deleteObjectTool: McpTool = {
    definition: {
      name: "delete_object",
      description: "Delete an object from an S3 bucket.",
      inputSchema: {
        type: "object",
        properties: {
          bucket: { type: "string", description: "Bucket name" },
          key: { type: "string", description: "Object key" },
        },
        required: ["bucket", "key"],
      },
    },
    handler: async (args) => {
      return safeRun(async () => {
        await s3.deleteObject(args.bucket as string, args.key as string);
        return `Object "${args.key}" deleted from bucket "${args.bucket}"`;
      });
    },
  };

  const headObjectTool: McpTool = {
    definition: {
      name: "head_object",
      description: "Get metadata of an S3 object without its content.",
      inputSchema: {
        type: "object",
        properties: {
          bucket: { type: "string", description: "Bucket name" },
          key: { type: "string", description: "Object key" },
        },
        required: ["bucket", "key"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          return await s3.headObject(args.bucket as string, args.key as string);
        },
        (meta) => JSON.stringify(meta, null, 2),
      );
    },
  };

  return [
    listBucketsTool,
    createBucketTool,
    deleteBucketTool,
    listObjectsTool,
    getObjectTool,
    putObjectTool,
    deleteObjectTool,
    headObjectTool,
  ];
}
