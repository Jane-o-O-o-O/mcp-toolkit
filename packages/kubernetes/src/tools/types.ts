/** Kubernetes client interface for testability */
export interface KubernetesClient {
  listPods(namespace?: string): Promise<PodInfo[]>;
  getPod(name: string, namespace?: string): Promise<PodDetail>;
  listDeployments(namespace?: string): Promise<DeploymentInfo[]>;
  scaleDeployment(name: string, replicas: number, namespace?: string): Promise<ScaleResult>;
  listServices(namespace?: string): Promise<ServiceInfo[]>;
  getLogs(podName: string, namespace?: string, tailLines?: number): Promise<string>;
  listNamespaces(): Promise<NamespaceInfo[]>;
  describeResource(kind: string, name: string, namespace?: string): Promise<ResourceDetail>;
}

export interface PodInfo {
  name: string;
  namespace: string;
  status: string;
  ready: string;
  restarts: number;
  node: string;
  age: string;
}

export interface PodDetail {
  name: string;
  namespace: string;
  status: string;
  ip: string;
  node: string;
  containers: Array<{ name: string; image: string; ready: boolean; restartCount: number }>;
  conditions: Array<{ type: string; status: string }>;
  createdAt: string;
}

export interface DeploymentInfo {
  name: string;
  namespace: string;
  ready: string;
  upToDate: number;
  available: number;
  age: string;
}

export interface ScaleResult {
  name: string;
  namespace: string;
  previousReplicas: number;
  desiredReplicas: number;
}

export interface ServiceInfo {
  name: string;
  namespace: string;
  type: string;
  clusterIP: string;
  ports: string;
  age: string;
}

export interface NamespaceInfo {
  name: string;
  status: string;
  age: string;
}

export interface ResourceDetail {
  kind: string;
  name: string;
  namespace: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  createdAt: string;
  details: Record<string, unknown>;
}
