import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, KubernetesConfigSchema } from "../src/config.js";

describe("KubernetesConfigSchema", () => {
  it("validates with defaults", () => {
    const result = KubernetesConfigSchema.parse({});
    expect(result.namespace).toBe("default");
    expect(result.logLevel).toBe("info");
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
  });

  it("accepts kubeconfig path", () => {
    const result = KubernetesConfigSchema.parse({
      kubeconfig: "/home/user/.kube/config",
    });
    expect(result.kubeconfig).toBe("/home/user/.kube/config");
  });

  it("accepts context", () => {
    const result = KubernetesConfigSchema.parse({
      context: "minikube",
      namespace: "production",
    });
    expect(result.context).toBe("minikube");
    expect(result.namespace).toBe("production");
  });

  it("accepts server and token", () => {
    const result = KubernetesConfigSchema.parse({
      server: "https://k8s.example.com",
      token: "eyJhbGciOiJSUzI1NiIs...",
    });
    expect(result.server).toBe("https://k8s.example.com");
    expect(result.token).toBe("eyJhbGciOiJSUzI1NiIs...");
  });

  it("rejects invalid log level", () => {
    expect(() =>
      KubernetesConfigSchema.parse({ logLevel: "verbose" }),
    ).toThrow();
  });

  it("rejects invalid transport", () => {
    expect(() =>
      KubernetesConfigSchema.parse({ transport: "websocket" }),
    ).toThrow();
  });
});

describe("loadConfig", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("loads config with defaults", () => {
    delete process.env.KUBECONFIG;
    delete process.env.K8S_CONTEXT;
    delete process.env.K8S_NAMESPACE;
    delete process.env.K8S_SERVER;
    delete process.env.K8S_TOKEN;

    const config = loadConfig();
    expect(config.namespace).toBe("default");
    expect(config.logLevel).toBe("info");
    expect(config.transport).toBe("stdio");
  });

  it("loads config from environment variables", () => {
    process.env.K8S_NAMESPACE = "kube-system";
    process.env.K8S_CONTEXT = "production";
    process.env.MCP_LOG_LEVEL = "debug";

    const config = loadConfig();
    expect(config.namespace).toBe("kube-system");
    expect(config.context).toBe("production");
    expect(config.logLevel).toBe("debug");
  });
});
