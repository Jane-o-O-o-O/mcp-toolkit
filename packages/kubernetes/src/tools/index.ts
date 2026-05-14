import type { KubernetesClient } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createKubernetesTools(k8s: KubernetesClient): McpTool[] {
  const listPodsTool: McpTool = {
    definition: {
      name: "list_pods",
      description: "List pods in a namespace. Shows name, status, ready state, restarts, node, and age.",
      inputSchema: {
        type: "object",
        properties: {
          namespace: { type: "string", description: "Kubernetes namespace (default: configured namespace)" },
        },
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const pods = await k8s.listPods(args.namespace as string | undefined);
          return pods;
        },
        (pods) => JSON.stringify(pods, null, 2),
      );
    },
  };

  const getPodTool: McpTool = {
    definition: {
      name: "get_pod",
      description: "Get detailed information about a specific pod (containers, conditions, IP, node).",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Pod name" },
          namespace: { type: "string", description: "Kubernetes namespace" },
        },
        required: ["name"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const pod = await k8s.getPod(args.name as string, args.namespace as string | undefined);
          return pod;
        },
        (pod) => JSON.stringify(pod, null, 2),
      );
    },
  };

  const listDeploymentsTool: McpTool = {
    definition: {
      name: "list_deployments",
      description: "List deployments in a namespace with ready state, up-to-date, and available replicas.",
      inputSchema: {
        type: "object",
        properties: {
          namespace: { type: "string", description: "Kubernetes namespace" },
        },
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const deployments = await k8s.listDeployments(args.namespace as string | undefined);
          return deployments;
        },
        (deps) => JSON.stringify(deps, null, 2),
      );
    },
  };

  const scaleDeploymentTool: McpTool = {
    definition: {
      name: "scale_deployment",
      description: "Scale a deployment to the desired number of replicas.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Deployment name" },
          replicas: { type: "number", description: "Desired number of replicas" },
          namespace: { type: "string", description: "Kubernetes namespace" },
        },
        required: ["name", "replicas"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const result = await k8s.scaleDeployment(
            args.name as string,
            args.replicas as number,
            args.namespace as string | undefined,
          );
          return result;
        },
        (r) => `Scaled ${r.name} from ${r.previousReplicas} to ${r.desiredReplicas} replicas`,
      );
    },
  };

  const listServicesTool: McpTool = {
    definition: {
      name: "list_services",
      description: "List services in a namespace with type, cluster IP, and ports.",
      inputSchema: {
        type: "object",
        properties: {
          namespace: { type: "string", description: "Kubernetes namespace" },
        },
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const services = await k8s.listServices(args.namespace as string | undefined);
          return services;
        },
        (svcs) => JSON.stringify(svcs, null, 2),
      );
    },
  };

  const getLogsTool: McpTool = {
    definition: {
      name: "get_logs",
      description: "Get logs from a pod (last N lines).",
      inputSchema: {
        type: "object",
        properties: {
          pod: { type: "string", description: "Pod name" },
          namespace: { type: "string", description: "Kubernetes namespace" },
          tail: { type: "number", description: "Number of log lines to return (default: 100)" },
        },
        required: ["pod"],
      },
    },
    handler: async (args) => {
      return safeRun(async () => {
        const logs = await k8s.getLogs(
          args.pod as string,
          args.namespace as string | undefined,
          (args.tail as number) ?? 100,
        );
        return logs;
      });
    },
  };

  const listNamespacesTool: McpTool = {
    definition: {
      name: "list_namespaces",
      description: "List all Kubernetes namespaces with their status.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () => {
      return safeRun(
        async () => {
          const namespaces = await k8s.listNamespaces();
          return namespaces;
        },
        (ns) => JSON.stringify(ns, null, 2),
      );
    },
  };

  const describeResourceTool: McpTool = {
    definition: {
      name: "describe_resource",
      description: "Describe a Kubernetes resource (pod, deployment, service, etc.) with labels, annotations, and details.",
      inputSchema: {
        type: "object",
        properties: {
          kind: { type: "string", description: "Resource kind (pod, deployment, service, configmap, secret, etc.)" },
          name: { type: "string", description: "Resource name" },
          namespace: { type: "string", description: "Kubernetes namespace" },
        },
        required: ["kind", "name"],
      },
    },
    handler: async (args) => {
      return safeRun(
        async () => {
          const detail = await k8s.describeResource(
            args.kind as string,
            args.name as string,
            args.namespace as string | undefined,
          );
          return detail;
        },
        (d) => JSON.stringify(d, null, 2),
      );
    },
  };

  return [
    listPodsTool,
    getPodTool,
    listDeploymentsTool,
    scaleDeploymentTool,
    listServicesTool,
    getLogsTool,
    listNamespacesTool,
    describeResourceTool,
  ];
}
