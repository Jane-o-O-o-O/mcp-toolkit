/** Notion client interface for testability */
export interface NotionClient {
  search(query: string, filter?: { type: "page" | "database" }): Promise<SearchResult[]>;
  listPages(databaseId: string, filter?: Record<string, unknown>, sorts?: SortParam[]): Promise<PageSummary[]>;
  getPage(pageId: string): Promise<PageDetail>;
  createPage(parent: ParentRef, properties: Record<string, unknown>, children?: Block[]): Promise<PageResult>;
  updatePage(pageId: string, properties: Record<string, unknown>): Promise<PageResult>;
  getDatabase(databaseId: string): Promise<DatabaseSchema>;
  queryDatabase(databaseId: string, filter?: Record<string, unknown>, sorts?: SortParam[], pageSize?: number): Promise<QueryDatabaseResult>;
  getBlockChildren(blockId: string, pageSize?: number): Promise<BlockChildrenResult>;
  appendBlockChildren(blockId: string, children: Block[]): Promise<AppendBlocksResult>;
}

export interface SearchResult {
  object: string;
  id: string;
  title: string;
  url: string;
  lastEditedTime: string;
}

export interface PageSummary {
  id: string;
  title: string;
  url: string;
  createdTime: string;
  lastEditedTime: string;
}

export interface PageDetail {
  id: string;
  title: string;
  url: string;
  properties: Record<string, unknown>;
  createdTime: string;
  lastEditedTime: string;
}

export interface PageResult {
  id: string;
  url: string;
  createdTime?: string;
  lastEditedTime?: string;
}

export interface ParentRef {
  type: "database_id" | "page_id" | "workspace";
  id?: string;
}

export interface Block {
  object?: string;
  type: string;
  [key: string]: unknown;
}

export interface DatabaseSchema {
  id: string;
  title: string;
  properties: Record<string, { type: string; [key: string]: unknown }>;
  url: string;
}

export interface SortParam {
  property?: string;
  direction?: "ascending" | "descending";
  timestamp?: "created_time" | "last_edited_time";
}

export interface QueryDatabaseResult {
  pages: PageSummary[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface BlockChildrenResult {
  blocks: Block[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface AppendBlocksResult {
  blockCount: number;
}
