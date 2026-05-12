/** Docker client interface for testability */
export interface DockerClient {
  listContainers(options?: { all?: boolean; filters?: string }): Promise<ContainerInfo[]>;
  getContainer(id: string): ContainerInspect;
  listImages(options?: { filters?: string }): Promise<ImageInfo[]>;
}

export interface ContainerInfo {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
  Ports: Array<{ PrivatePort: number; PublicPort?: number; Type: string }>;
  Created: number;
}

export interface ContainerDetail {
  Id: string;
  Name: string;
  Config: { Image: string; Cmd?: string[]; Env?: string[] };
  State: { Status: string; Running: boolean; Pid: number; StartedAt: string };
  NetworkSettings: { Ports: Record<string, unknown> };
  Mounts: Array<{ Type: string; Source: string; Destination: string }>;
}

export interface ContainerInspect {
  inspect(): Promise<ContainerDetail>;
  start(): Promise<void>;
  stop(options?: { t?: number }): Promise<void>;
  remove(options?: { force?: boolean }): Promise<void>;
  logs(options?: { stdout?: boolean; stderr?: boolean; tail?: number }): Promise<string>;
}

export interface ImageInfo {
  Id: string;
  RepoTags: string[] | null;
  Size: number;
  Created: number;
}
