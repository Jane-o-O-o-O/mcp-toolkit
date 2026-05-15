#!/usr/bin/env node

import { createServerContext, startServer } from "./server.js";
import { loadConfig } from "./config.js";
import type {
  VercelClient,
  VercelDeployment,
  VercelProject,
  VercelEnvVar,
  VercelDomain,
} from "./tools/types.js";

function createVercelClient(): VercelClient {
  const config = loadConfig();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.token}`,
    "Content-Type": "application/json",
  };
  const teamParam = config.teamId ? `?teamId=${config.teamId}` : "";

  async function fetchVercel<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${config.baseUrl}${path}${teamParam}`;
    const res = await fetch(url, { headers, ...init });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Vercel API error ${res.status}: ${body}`);
    }
    return (await res.json()) as T;
  }

  return {
    async listDeployments(params) {
      const searchParams = new URLSearchParams();
      if (params?.projectId) searchParams.set("projectId", params.projectId);
      if (params?.limit) searchParams.set("limit", String(params.limit));
      if (params?.target) searchParams.set("target", params.target);
      const qs = searchParams.toString();
      const data = await fetchVercel<{ deployments: VercelDeployment[] }>(`/v6/deployments${qs ? `?${qs}` : ""}`);
      return data.deployments;
    },

    async getDeployment(id) {
      return fetchVercel<VercelDeployment>(`/v13/deployments/${id}`);
    },

    async listProjects(params) {
      const qs = params?.limit ? `?limit=${params.limit}` : "";
      const data = await fetchVercel<{ projects: VercelProject[] }>(`/v9/projects${qs}`);
      return data.projects;
    },

    async getProject(id) {
      return fetchVercel<VercelProject>(`/v9/projects/${id}`);
    },

    async createProject(data) {
      return fetchVercel<VercelProject>("/v9/projects", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async listEnvVars(projectId) {
      const data = await fetchVercel<{ envs: VercelEnvVar[] }>(`/v9/projects/${projectId}/env`);
      return data.envs;
    },

    async setEnvVar(projectId, data) {
      return fetchVercel<VercelEnvVar>(`/v9/projects/${projectId}/env`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async listDomains(projectId) {
      const data = await fetchVercel<{ domains: VercelDomain[] }>(`/v9/projects/${projectId}/domains`);
      return data.domains;
    },
  };
}

async function main(): Promise<void> {
  let ctx;
  try {
    const client = createVercelClient();
    ctx = createServerContext(client);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to start: ${message}`);
    process.exit(1);
  }

  const shutdown = async () => {
    ctx.logger.info("Shutting down...");
    await ctx.server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await startServer(ctx);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
