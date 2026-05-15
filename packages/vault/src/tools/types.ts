/** Vault client interface for testability */
export interface VaultClient {
  readSecret(path: string): Promise<VaultSecretResponse>;
  writeSecret(path: string, data: Record<string, unknown>): Promise<VaultSecretResponse>;
  deleteSecret(path: string): Promise<void>;
  listSecrets(path: string): Promise<VaultListResponse>;
  readSecretMetadata(path: string): Promise<VaultMetadataResponse>;
  listPolicies(): Promise<VaultPolicyListResponse>;
  readPolicy(name: string): Promise<VaultPolicyResponse>;
  getHealth(): Promise<VaultHealthResponse>;
}

export interface VaultSecretResponse {
  data: {
    data: Record<string, unknown>;
    metadata: {
      created_time: string;
      deletion_time: string;
      destroyed: boolean;
      version: number;
    };
  };
}

export interface VaultListResponse {
  data: {
    keys: string[];
  };
}

export interface VaultMetadataResponse {
  data: {
    created_time: string;
    current_version: number;
    max_versions: number;
    oldest_version: number;
    updated_time: string;
    versions: Record<string, {
      created_time: string;
      deletion_time: string;
      destroyed: boolean;
    }>;
  };
}

export interface VaultPolicyListResponse {
  data: {
    keys: string[];
    policies: string[];
  };
}

export interface VaultPolicyResponse {
  data: {
    name: string;
    rules: string;
  };
}

export interface VaultHealthResponse {
  initialized: boolean;
  sealed: false;
  standby: boolean;
  performance_standby: boolean;
  replication_performance_mode: string;
  replication_dr_mode: string;
  server_time_utc: number;
  version: string;
  cluster_name: string;
  cluster_id: string;
}
