/** Sentry client interface for testability */
export interface SentryClient {
  listProjects(): Promise<SentryProject[]>;
  getProject(projectSlug: string): Promise<SentryProject>;
  listIssues(params?: { projectSlug?: string; query?: string; limit?: number }): Promise<SentryIssue[]>;
  getIssue(issueId: string): Promise<SentryIssue>;
  resolveIssue(issueId: string): Promise<SentryIssue>;
  listEvents(projectSlug: string, params?: { query?: string; limit?: number }): Promise<SentryEvent[]>;
  listReleases(projectSlug: string, params?: { limit?: number }): Promise<SentryRelease[]>;
  createRelease(data: { version: string; projects: string[]; ref?: string }): Promise<SentryRelease>;
}

export interface SentryProject {
  id: string;
  slug: string;
  name: string;
  platform?: string;
  status: string;
  dateCreated: string;
  features?: string[];
}

export interface SentryIssue {
  id: string;
  shortId: string;
  title: string;
  culprit?: string;
  level: string;
  status: string;
  count: number;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  project: { slug: string };
  permalink?: string;
  assignedTo?: { name: string; type: string };
}

export interface SentryEvent {
  id: string;
  eventID: string;
  message: string;
  platform?: string;
  dateCreated: string;
  tags?: Array<{ key: string; value: string }>;
  entries?: unknown[];
}

export interface SentryRelease {
  id: string;
  version: string;
  ref?: string;
  dateCreated: string;
  newGroups?: number;
  projects: Array<{ slug: string }>;
  deployCount?: number;
  lastDeploy?: { environment: string; dateFinished: string };
}
