export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: string;
  createdAt: number;
  readyState: string;
}

export interface VercelProject {
  id: string;
  name: string;
  framework?: string;
  link?: { repo: string; type: string };
  createdAt: number;
}

export interface VercelEnvVar {
  id: string;
  key: string;
  value: string;
  target: string[];
}

export interface VercelDomain {
  name: string;
  verified: boolean;
  createdAt: number;
}

export interface VercelClient {
  listDeployments(params?: {
    projectId?: string;
    limit?: number;
    target?: string;
  }): Promise<VercelDeployment[]>;

  getDeployment(id: string): Promise<VercelDeployment>;

  listProjects(params?: { limit?: number }): Promise<VercelProject[]>;

  getProject(id: string): Promise<VercelProject>;

  createProject(data: {
    name: string;
    framework?: string;
    gitRepository?: { repo: string; type: string };
  }): Promise<VercelProject>;

  listEnvVars(projectId: string): Promise<VercelEnvVar[]>;

  setEnvVar(
    projectId: string,
    data: { key: string; value: string; target?: string[] },
  ): Promise<VercelEnvVar>;

  listDomains(projectId: string): Promise<VercelDomain[]>;
}
