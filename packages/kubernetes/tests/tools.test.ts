import { describe, it, expect, vi } from "vitest";
import { createKubernetesTools } from "../src/tools/index.js";
import type { KubernetesClient } from "../src/tools/types.js";

function mockK8sClient(overrides: Partial<KubernetesClient> = {}): KubernetesClient {
  return {
    listPods: vi.fn().mockResolvedValue([
      {
        name: "nginx-7fb96c846b-abc12",
        namespace: "default",
        status: "Running",
        ready: "1/1",
        restarts: 0,
        node: "node-1",
        age: "3d",
      },
    ]),
    getPod: vi.fn().mockResolvedValue({
      name: "nginx-7fb96c846b-abc12",
      namespace: "default",
      status: "Running",
      ip: "10.244.0.5",
      node: "node-1",
      containers: [
        { name: "nginx", image: "nginx:latest", ready: true, restartCount: 0 },
      ],
      conditions: [
        { type: "Ready", status: "True" },
        { type: "Initialized", status: "True" },
      ],
      createdAt: "2026-05-11T08:00:00Z",
    }),
    listDeployments: vi.fn().mockResolvedValue([
      {
        name: "nginx",
        namespace: "default",
        ready: "3/3",
        upToDate: 3,
        available: 3,
        age: "5d",
      },
    ]),
    scaleDeployment: vi.fn().mockResolvedValue({
      name: "nginx",
      namespace: "default",
      previousReplicas: 3,
      desiredReplicas: 5,
    }),
    listServices: vi.fn().mockResolvedValue([
      {
        name: "kubernetes",
        namespace: "default",
        type: "ClusterIP",
        clusterIP: "10.96.0.1",
        ports: "443:443/TCP",
        age: "10d",
      },
    ]),
    getLogs: vi.fn().mockResolvedValue("2026-05-14 08:00:00 server started\n2026-05-14 08:00:01 listening on :80"),
    listNamespaces: vi.fn().mockResolvedValue([
      { name: "default", status: "Active", age: "10d" },
      { name: "kube-system", status: "Active", age: "10d" },
    ]),
    describeResource: vi.fn().mockResolvedValue({
      kind: "Deployment",
      name: "nginx",
      namespace: "default",
      labels: { app: "nginx" },
      annotations: { "kubectl.kubernetes.io/last-applied-configuration": "{}" },
      createdAt: "2026-05-09T08:00:00Z",
      details: { replicas: 3, selector: { matchLabels: { app: "nginx" } } },
    }),
    ...overrides,
  };
}

describe("Kubernetes tools", () => {
  it("should have 8 tools", () => {
    const tools = createKubernetesTools(mockK8sClient());
    expect(tools).toHaveLength(8);
  });

  describe("list_pods", () => {
    it("should list pods in default namespace", async () => {
      const client = mockK8sClient();
      const tools = createKubernetesTools(client);
      const tool = tools.find((t) => t.definition.name === "list_pods")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("nginx-7fb96c846b-abc12");
      expect(result.content[0].text).toContain("Running");
      expect(client.listPods).toHaveBeenCalledWith(undefined);
    });

    it("should list pods in specified namespace", async () => {
      const client = mockK8sClient();
      const tools = createKubernetesTools(client);
      const tool = tools.find((t) => t.definition.name === "list_pods")!;

      await tool.handler({ namespace: "kube-system" });
      expect(client.listPods).toHaveBeenCalledWith("kube-system");
    });
  });

  describe("get_pod", () => {
    it("should return pod details", async () => {
      const client = mockK8sClient();
      const tools = createKubernetesTools(client);
      const tool = tools.find((t) => t.definition.name === "get_pod")!;

      const result = await tool.handler({ name: "nginx-abc12" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("10.244.0.5");
      expect(result.content[0].text).toContain("nginx:latest");
      expect(client.getPod).toHaveBeenCalledWith("nginx-abc12", undefined);
    });
  });

  describe("list_deployments", () => {
    it("should list deployments", async () => {
      const client = mockK8sClient();
      const tools = createKubernetesTools(client);
      const tool = tools.find((t) => t.definition.name === "list_deployments")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("nginx");
      expect(result.content[0].text).toContain("3/3");
    });
  });

  describe("scale_deployment", () => {
    it("should scale a deployment", async () => {
      const client = mockK8sClient();
      const tools = createKubernetesTools(client);
      const tool = tools.find((t) => t.definition.name === "scale_deployment")!;

      const result = await tool.handler({ name: "nginx", replicas: 5 });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("3");
      expect(result.content[0].text).toContain("5");
      expect(client.scaleDeployment).toHaveBeenCalledWith("nginx", 5, undefined);
    });

    it("should scale with namespace", async () => {
      const client = mockK8sClient();
      const tools = createKubernetesTools(client);
      const tool = tools.find((t) => t.definition.name === "scale_deployment")!;

      await tool.handler({ name: "nginx", replicas: 1, namespace: "production" });
      expect(client.scaleDeployment).toHaveBeenCalledWith("nginx", 1, "production");
    });
  });

  describe("list_services", () => {
    it("should list services", async () => {
      const client = mockK8sClient();
      const tools = createKubernetesTools(client);
      const tool = tools.find((t) => t.definition.name === "list_services")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("kubernetes");
      expect(result.content[0].text).toContain("ClusterIP");
    });
  });

  describe("get_logs", () => {
    it("should get pod logs", async () => {
      const client = mockK8sClient();
      const tools = createKubernetesTools(client);
      const tool = tools.find((t) => t.definition.name === "get_logs")!;

      const result = await tool.handler({ pod: "nginx-abc12", tail: 50 });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("server started");
      expect(client.getLogs).toHaveBeenCalledWith("nginx-abc12", undefined, 50);
    });

    it("should use default tail of 100", async () => {
      const client = mockK8sClient();
      const tools = createKubernetesTools(client);
      const tool = tools.find((t) => t.definition.name === "get_logs")!;

      await tool.handler({ pod: "nginx-abc12" });
      expect(client.getLogs).toHaveBeenCalledWith("nginx-abc12", undefined, 100);
    });
  });

  describe("list_namespaces", () => {
    it("should list namespaces", async () => {
      const client = mockK8sClient();
      const tools = createKubernetesTools(client);
      const tool = tools.find((t) => t.definition.name === "list_namespaces")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("default");
      expect(result.content[0].text).toContain("kube-system");
    });
  });

  describe("describe_resource", () => {
    it("should describe a deployment", async () => {
      const client = mockK8sClient();
      const tools = createKubernetesTools(client);
      const tool = tools.find((t) => t.definition.name === "describe_resource")!;

      const result = await tool.handler({ kind: "deployment", name: "nginx" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("nginx");
      expect(result.content[0].text).toContain("app");
      expect(client.describeResource).toHaveBeenCalledWith("deployment", "nginx", undefined);
    });

    it("should pass namespace", async () => {
      const client = mockK8sClient();
      const tools = createKubernetesTools(client);
      const tool = tools.find((t) => t.definition.name === "describe_resource")!;

      await tool.handler({ kind: "pod", name: "nginx-abc12", namespace: "staging" });
      expect(client.describeResource).toHaveBeenCalledWith("pod", "nginx-abc12", "staging");
    });
  });

  describe("error handling", () => {
    it("should return error on API failure", async () => {
      const client = mockK8sClient({
        listPods: vi.fn().mockRejectedValue(new Error("connection refused")),
      });
      const tools = createKubernetesTools(client);
      const tool = tools.find((t) => t.definition.name === "list_pods")!;

      const result = await tool.handler({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("connection refused");
    });
  });
});
