/** Ansible client interface for testability */
export interface AnsibleClient {
  runPlaybook(playbook: string, inventory?: string, extraVars?: Record<string, string>, limit?: string): Promise<PlaybookResult>;
  listHosts(inventory?: string, pattern?: string): Promise<HostInfo[]>;
  runAdHoc(module: string, args: string, hosts?: string, inventory?: string): Promise<AdHocResult>;
  listRoles(path?: string): Promise<RoleInfo[]>;
  listCollections(): Promise<CollectionInfo[]>;
  vaultEncrypt(content: string, vaultId?: string): Promise<string>;
  vaultDecrypt(content: string, vaultId?: string): Promise<string>;
  galaxyInstall(name: string, type?: "role" | "collection"): Promise<GalaxyResult>;
}

export interface PlaybookResult {
  playbook: string;
  status: "success" | "failure" | "unreachable";
  plays: number;
  tasks: number;
  hosts: number;
  recap: string;
  raw: string;
}

export interface HostInfo {
  name: string;
  groups: string[];
  variables: Record<string, unknown>;
}

export interface AdHocResult {
  module: string;
  hosts: number;
  success: number;
  failures: number;
  unreachable: number;
  raw: string;
}

export interface RoleInfo {
  name: string;
  path: string;
  version?: string;
}

export interface CollectionInfo {
  name: string;
  version: string;
  path: string;
}

export interface GalaxyResult {
  name: string;
  type: "role" | "collection";
  version?: string;
  status: string;
}
