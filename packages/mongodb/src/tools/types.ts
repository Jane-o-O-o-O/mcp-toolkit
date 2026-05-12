/** MongoDB client interface for testability */
export interface MongoDBClient {
  listDatabases(): Promise<Array<{ name: string; sizeOnDisk?: number }>>;
  listCollections(db: string): Promise<string[]>;
  find(db: string, collection: string, filter: Record<string, unknown>, options?: { limit?: number; sort?: Record<string, 1 | -1>; projection?: Record<string, 0 | 1> }): Promise<unknown[]>;
  findOne(db: string, collection: string, filter: Record<string, unknown>): Promise<unknown | null>;
  insertOne(db: string, collection: string, document: Record<string, unknown>): Promise<{ insertedId: string }>;
  insertMany(db: string, collection: string, documents: Record<string, unknown>[]): Promise<{ insertedIds: string[] }>;
  updateOne(db: string, collection: string, filter: Record<string, unknown>, update: Record<string, unknown>): Promise<{ matchedCount: number; modifiedCount: number }>;
  updateMany(db: string, collection: string, filter: Record<string, unknown>, update: Record<string, unknown>): Promise<{ matchedCount: number; modifiedCount: number }>;
  deleteOne(db: string, collection: string, filter: Record<string, unknown>): Promise<{ deletedCount: number }>;
  deleteMany(db: string, collection: string, filter: Record<string, unknown>): Promise<{ deletedCount: number }>;
  count(db: string, collection: string, filter?: Record<string, unknown>): Promise<number>;
  aggregate(db: string, collection: string, pipeline: Record<string, unknown>[]): Promise<unknown[]>;
  close(): Promise<void>;
}

export async function createMongoDBClient(connectionString: string): Promise<MongoDBClient> {
  const { MongoClient } = await import("mongodb");
  const client = new MongoClient(connectionString);
  await client.connect();

  function getDb(name: string) {
    return client.db(name);
  }

  return {
    async listDatabases() {
      const admin = client.db().admin();
      const result = await admin.listDatabases();
      return result.databases;
    },
    async listCollections(db: string) {
      const collections = await getDb(db).listCollections().toArray();
      return collections.map((c) => c.name);
    },
    async find(db, collection, filter, options = {}) {
      let cursor = getDb(db).collection(collection).find(filter);
      if (options.sort) cursor = cursor.sort(options.sort);
      if (options.limit) cursor = cursor.limit(options.limit);
      if (options.projection) cursor = cursor.project(options.projection);
      return cursor.toArray();
    },
    async findOne(db, collection, filter) {
      return getDb(db).collection(collection).findOne(filter);
    },
    async insertOne(db, collection, document) {
      const result = await getDb(db).collection(collection).insertOne(document);
      return { insertedId: result.insertedId.toString() };
    },
    async insertMany(db, collection, documents) {
      const result = await getDb(db).collection(collection).insertMany(documents);
      return { insertedIds: Object.values(result.insertedIds).map((id) => id.toString()) };
    },
    async updateOne(db, collection, filter, update) {
      const result = await getDb(db).collection(collection).updateOne(filter, update);
      return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
    },
    async updateMany(db, collection, filter, update) {
      const result = await getDb(db).collection(collection).updateMany(filter, update);
      return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
    },
    async deleteOne(db, collection, filter) {
      const result = await getDb(db).collection(collection).deleteOne(filter);
      return { deletedCount: result.deletedCount };
    },
    async deleteMany(db, collection, filter) {
      const result = await getDb(db).collection(collection).deleteMany(filter);
      return { deletedCount: result.deletedCount };
    },
    async count(db, collection, filter = {}) {
      return getDb(db).collection(collection).countDocuments(filter);
    },
    async aggregate(db, collection, pipeline) {
      return getDb(db).collection(collection).aggregate(pipeline).toArray();
    },
    async close() {
      await client.close();
    },
  };
}
