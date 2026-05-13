import type { S3Client } from "./tools/types.js";
import { createS3Tools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type S3Config } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  s3: S3Client;
  logger: Logger;
  config: S3Config;
}

/** Create an S3 client using dynamic import to handle ESM/CJS interop */
async function createRealS3Client(config: S3Config): Promise<S3Client> {
  const { S3Client: AwsS3Client, ...cmds } = await import("@aws-sdk/client-s3");

  const client = new AwsS3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: config.forcePathStyle,
  });

  return {
    async listBuckets() {
      const res = await client.send(new cmds.ListBucketsCommand({}));
      return (res.Buckets ?? []).map((b) => ({
        Name: b.Name ?? "",
        CreationDate: b.CreationDate?.toISOString() ?? "",
      }));
    },

    async createBucket(name: string) {
      await client.send(new cmds.CreateBucketCommand({ Bucket: name }));
    },

    async deleteBucket(name: string) {
      await client.send(new cmds.DeleteBucketCommand({ Bucket: name }));
    },

    async listObjects(bucket: string, prefix?: string, maxKeys?: number) {
      const res = await client.send(
        new cmds.ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          MaxKeys: maxKeys ?? 1000,
        }),
      );
      return (res.Contents ?? []).map((o) => ({
        Key: o.Key ?? "",
        Size: o.Size ?? 0,
        LastModified: o.LastModified?.toISOString() ?? "",
        ETag: o.ETag,
        StorageClass: o.StorageClass,
      }));
    },

    async getObject(bucket: string, key: string) {
      const res = await client.send(
        new cmds.GetObjectCommand({ Bucket: bucket, Key: key }),
      );
      return (await res.Body?.transformToString()) ?? "";
    },

    async putObject(bucket: string, key: string, body: string, contentType?: string) {
      await client.send(
        new cmds.PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType ?? "text/plain",
        }),
      );
    },

    async deleteObject(bucket: string, key: string) {
      await client.send(
        new cmds.DeleteObjectCommand({ Bucket: bucket, Key: key }),
      );
    },

    async headObject(bucket: string, key: string) {
      const res = await client.send(
        new cmds.HeadObjectCommand({ Bucket: bucket, Key: key }),
      );
      return {
        ContentType: res.ContentType,
        ContentLength: res.ContentLength,
        ETag: res.ETag,
        LastModified: res.LastModified?.toISOString(),
        Metadata: res.Metadata,
      };
    },
  };
}

export async function createServerContext(config?: Partial<S3Config>): Promise<ServerContext> {
  const fullConfig = config?.accessKeyId
    ? {
        endpoint: config.endpoint,
        region: config.region ?? "us-east-1",
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey!,
        forcePathStyle: config.forcePathStyle ?? true,
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({
    name: "s3",
    level: fullConfig.logLevel,
  });

  const s3 = await createRealS3Client(fullConfig);
  const tools = createS3Tools(s3);
  const server = createMcpServer("@mcp-toolkit/s3", "0.1.0", tools, logger);

  return { server, s3, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "S3", {
    transport: ctx.config.transport,
    port: ctx.config.port,
  });
}
