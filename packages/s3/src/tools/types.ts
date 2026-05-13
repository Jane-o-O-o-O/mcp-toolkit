/** S3 client interface for testability */
export interface S3Client {
  listBuckets(): Promise<Bucket[]>;
  createBucket(name: string): Promise<void>;
  deleteBucket(name: string): Promise<void>;
  listObjects(bucket: string, prefix?: string, maxKeys?: number): Promise<S3Object[]>;
  getObject(bucket: string, key: string): Promise<string>;
  putObject(bucket: string, key: string, body: string, contentType?: string): Promise<void>;
  deleteObject(bucket: string, key: string): Promise<void>;
  headObject(bucket: string, key: string): Promise<ObjectMetadata>;
}

export interface Bucket {
  Name: string;
  CreationDate: string;
}

export interface S3Object {
  Key: string;
  Size: number;
  LastModified: string;
  ETag?: string;
  StorageClass?: string;
}

export interface ObjectMetadata {
  ContentType?: string;
  ContentLength?: number;
  ETag?: string;
  LastModified?: string;
  Metadata?: Record<string, string>;
}
