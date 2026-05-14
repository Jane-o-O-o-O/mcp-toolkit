/** Grafana client interface for testability */
export interface GrafanaClient {
  listDashboards(): Promise<DashboardSummary[]>;
  getDashboard(uid: string): Promise<DashboardDetail>;
  createDashboard(dashboard: CreateDashboardRequest): Promise<DashboardResult>;
  listDatasources(): Promise<DatasourceInfo[]>;
  queryDatasource(datasourceId: number, query: string, from?: string, to?: string): Promise<QueryResult>;
  listAlertRules(): Promise<AlertRule[]>;
  createAnnotation(text: string, tags?: string[], dashboardUid?: string, time?: number, timeEnd?: number): Promise<AnnotationResult>;
  search(query: string, type?: string): Promise<SearchResult[]>;
}

export interface DashboardSummary {
  uid: string;
  title: string;
  url: string;
  tags: string[];
  folderTitle: string;
  updated: string;
}

export interface DashboardDetail {
  uid: string;
  title: string;
  tags: string[];
  panels: Array<{ id: number; title: string; type: string }>;
  templating: Array<{ name: string; type: string }>;
  time: { from: string; to: string };
  version: number;
}

export interface CreateDashboardRequest {
  dashboard: {
    title: string;
    tags?: string[];
    panels?: Array<{ id: number; title: string; type: string; targets?: Array<{ expr?: string; query?: string }> }>;
    templating?: { list?: Array<{ name: string; type: string }> };
  };
  folderUid?: string;
  overwrite?: boolean;
}

export interface DashboardResult {
  uid: string;
  url: string;
  version: number;
  status: string;
}

export interface DatasourceInfo {
  id: number;
  uid: string;
  name: string;
  type: string;
  url: string;
  isDefault: boolean;
}

export interface QueryResult {
  results: Array<{ series?: Array<{ name: string; columns: string[]; values: unknown[][] }> }>;
}

export interface AlertRule {
  uid: string;
  title: string;
  state: string;
  folderUid: string;
  updated: string;
  condition: string;
}

export interface AnnotationResult {
  id: number;
  message: string;
}

export interface SearchResult {
  uid: string;
  title: string;
  url: string;
  type: string;
  tags: string[];
}
