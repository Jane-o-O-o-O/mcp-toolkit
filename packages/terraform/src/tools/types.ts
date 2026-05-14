/** Terraform client interface for testability */
export interface TerraformClient {
  listWorkspaces(): Promise<WorkspaceInfo[]>;
  selectWorkspace(name: string): Promise<WorkspaceSelectResult>;
  plan(vars?: Record<string, string>): Promise<PlanResult>;
  apply(vars?: Record<string, string>, autoApprove?: boolean): Promise<ApplyResult>;
  destroy(vars?: Record<string, string>, autoApprove?: boolean): Promise<DestroyResult>;
  output(): Promise<OutputResult[]>;
  stateList(): Promise<string[]>;
  stateShow(address: string): Promise<string>;
}

export interface WorkspaceInfo {
  name: string;
  current: boolean;
}

export interface WorkspaceSelectResult {
  previous: string;
  current: string;
}

export interface PlanResult {
  summary: string;
  additions: number;
  changes: number;
  destructions: number;
  hasChanges: boolean;
  raw: string;
}

export interface ApplyResult {
  summary: string;
  additions: number;
  changes: number;
  destructions: number;
  outputs: Record<string, unknown>;
  raw: string;
}

export interface DestroyResult {
  summary: string;
  destructions: number;
  raw: string;
}

export interface OutputResult {
  name: string;
  value: unknown;
  sensitive: boolean;
}
