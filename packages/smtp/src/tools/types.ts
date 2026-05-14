/** Email client interface for testability */
export interface EmailClient {
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
  listEmails(folder?: string, limit?: number): Promise<EmailInfo[]>;
  readEmail(uid: string, folder?: string): Promise<EmailDetail>;
  deleteEmail(uid: string, folder?: string): Promise<DeleteEmailResult>;
  listFolders(): Promise<FolderInfo[]>;
  searchEmails(query: string, folder?: string, limit?: number): Promise<EmailInfo[]>;
}

export interface SendEmailParams {
  to: string[];
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
  html?: boolean;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: string; encoding?: string }>;
}

export interface SendEmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

export interface EmailInfo {
  uid: string;
  subject: string;
  from: string;
  date: string;
  seen: boolean;
  flags: string[];
}

export interface EmailDetail extends EmailInfo {
  to: string[];
  cc?: string[];
  body: string;
  html?: string;
  attachments: Array<{ filename: string; size: number; contentType: string }>;
  headers: Record<string, string>;
}

export interface DeleteEmailResult {
  uid: string;
  folder: string;
  deleted: boolean;
}

export interface FolderInfo {
  name: string;
  delimiter: string;
  flags: string[];
  total?: number;
  unread?: number;
}
