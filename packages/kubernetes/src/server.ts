import type { KubernetesClient } from "./tools/types.js";
import { createKubernetesTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type KubernetesConfig } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  k8s: KubernetesClient;
  logger: Logger;
  config: KubernetesConfig;
}

/** Create a Kubernetes client using dynamic import */
async function createK8sClient(config: KubernetesConfig): Promise<KubernetesClient> {
  const k8s = await import("@kubernetes/client-node");
  const kc = new k8s.KubeConfig();

  if (config.server && config.token) {
    kc.loadFromCluster();
    const cluster = kc.getCurrentCluster();
    if (cluster) {
      (cluster as any).server = config.server;
    }
  } else if (config.kubeconfig) {
    kc.loadFromFile(config.kubeconfig);
  } else {
    kc.loadFromDefault();
  }

  if (config.context) {
    kc.setCurrentContext(config.context);
  }

  const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);
  const appsV1Api = kc.makeApiClient(k8s.AppsV1Api);

  const ns = config.namespace;

  return {
    async listPods(namespace?: string) {
      const pods = await coreV1Api.listNamespacedPod({ namespace: namespace ?? ns });
      return (pods.items ?? []).map((pod: any) => ({
        name: pod.metadata?.name ?? "",
        namespace: pod.metadata?.namespace ?? ns,
        status: pod.status?.phase ?? "Unknown",
        ready: (pod.status?.containerStatuses ?? [])
          .filter((c: any) => c.ready).length + "/" + (pod.status?.containerStatuses ?? []).length,
        restarts: (pod.status?.containerStatuses ?? [])
          .reduce((sum: number, c: any) => sum + (c.restartCount ?? 0), 0),
        node: pod.spec?.nodeName ?? "",
        age: pod.metadata?.creationTimestamp
          ? formatAge(new Date(pod.metadata.creationTimestamp))
          : "",
      }));
    },

    async getPod(name: string, namespace?: string) {
      const pod = await coreV1Api.readNamespacedPod({ name, namespace: namespace ?? ns });
      return {
        name: (pod as any).metadata?.name ?? "",
        namespace: (pod as any).metadata?.namespace ?? ns,
        status: (pod as any).status?.phase ?? "Unknown",
        ip: (pod as any).status?.podIP ?? "",
        node: (pod as any).spec?.nodeName ?? "",
        containers: ((pod as any).spec?.containers ?? []).map((c: any, i: number) => ({
          name: c.name,
          image: c.image ?? "",
          ready: (pod as any).status?.containerStatuses?.[i]?.ready ?? false,
          restartCount: (pod as any).status?.containerStatuses?.[i]?.restartCount ?? 0,
        })),
        conditions: ((pod as any).status?.conditions ?? []).map((c: any) => ({
          type: c.type,
          status: c.status ?? "Unknown",
        })),
        createdAt: (pod as any).metadata?.creationTimestamp ?? "",
      };
    },

    async listDeployments(namespace?: string) {
      const deps = await appsV1Api.listNamespacedDeployment({ namespace: namespace ?? ns });
      return (deps.items ?? []).map((dep: any) => ({
        name: dep.metadata?.name ?? "",
        namespace: dep.metadata?.namespace ?? ns,
        ready: `${dep.status?.readyReplicas ?? 0}/${dep.spec?.replicas ?? 0}`,
        upToDate: dep.status?.updatedReplicas ?? 0,
        available: dep.status?.availableReplicas ?? 0,
        age: dep.metadata?.creationTimestamp
          ? formatAge(new Date(dep.metadata.creationTimestamp))
          : "",
      }));
    },

    async scaleDeployment(name: string, replicas: number, namespace?: string) {
      const nsActual = namespace ?? ns;
      const dep = await appsV1Api.readNamespacedDeployment({ name, namespace: nsActual });
      const previousReplicas = (dep as any).spec?.replicas ?? 0;
      await appsV1Api.patchNamespacedDeploymentScale({
        name,
        namespace: nsActual,
        body: { spec: { replicas } },
      });
      return { name, namespace: nsActual, previousReplicas, desiredReplicas: replicas };
    },

    async listServices(namespace?: string) {
      const svcs = await coreV1Api.listNamespacedService({ namespace: namespace ?? ns });
      return (svcs.items ?? []).map((svc: any) => ({
        name: svc.metadata?.name ?? "",
        namespace: svc.metadata?.namespace ?? ns,
        type: svc.spec?.type ?? "ClusterIP",
        clusterIP: svc.spec?.clusterIP ?? "",
        ports: (svc.spec?.ports ?? [])
          .map((p: any) => `${p.port}:${p.targetPort ?? p.port}/${p.protocol ?? "TCP"}`)
          .join(", "),
        age: svc.metadata?.creationTimestamp
          ? formatAge(new Date(svc.metadata.creationTimestamp))
          : "",
      }));
    },

    async getLogs(podName: string, namespace?: string, tailLines?: number) {
      const logs = await coreV1Api.readNamespacedPodLog({
        name: podName,
        namespace: namespace ?? ns,
        tailLines,
      });
      return String(logs);
    },

    async listNamespaces() {
      const nsList = await coreV1Api.listNamespace();
      return (nsList.items ?? []).map((n: any) => ({
        name: n.metadata?.name ?? "",
        status: n.status?.phase ?? "Unknown",
        age: n.metadata?.creationTimestamp
          ? formatAge(new Date(n.metadata.creationTimestamp))
          : "",
      }));
    },

    async describeResource(kind: string, name: string, namespace?: string) {
      const nsActual = namespace ?? ns;
      let body: any;

      switch (kind.toLowerCase()) {
        case "pod":
        case "pods":
          body = await coreV1Api.readNamespacedPod({ name, namespace: nsActual });
          break;
        case "deployment":
        case "deployments":
          body = await appsV1Api.readNamespacedDeployment({ name, namespace: nsActual });
          break;
        case "service":
        case "services":
          body = await coreV1Api.readNamespacedService({ name, namespace: nsActual });
          break;
        case "configmap":
        case "configmaps":
          body = await coreV1Api.readNamespacedConfigMap({ name, namespace: nsActual });
          break;
        case "secret":
        case "secrets":
          body = await coreV1Api.readNamespacedSecret({ name, namespace: nsActual });
          break;
        case "namespace":
        case "namespaces":
          body = await coreV1Api.readNamespace({ name });
          break;
        default:
          throw new Error(`Unsupported resource kind: ${kind}. Supported: pod, deployment, service, configmap, secret, namespace`);
      }

      return {
        kind: body.kind ?? kind,
        name: body.metadata?.name ?? name,
        namespace: body.metadata?.namespace ?? nsActual,
        labels: body.metadata?.labels ?? {},
        annotations: body.metadata?.annotations ?? {},
        createdAt: body.metadata?.creationTimestamp ?? "",
        details: body.spec ?? {},
      };
    },
  };
}

function formatAge(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

export async function createServerContext(config?: Partial<KubernetesConfig>): Promise<ServerContext> {
  const fullConfig = config?.namespace
    ? {
        kubeconfig: config.kubeconfig,
        context: config.context,
        namespace: config.namespace,
        server: config.server,
        token: config.token,
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({
    name: "kubernetes",
    level: fullConfig.logLevel,
  });

  const k8s = await createK8sClient(fullConfig);
  const tools = createKubernetesTools(k8s);
  const server = createMcpServer("@mcp-toolkit/kubernetes", "0.1.0", tools, logger);

  return { server, k8s, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "Kubernetes", {
    transport: ctx.config.transport,
    port: ctx.config.port,
  });
}
