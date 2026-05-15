import type { StripeClient } from "./tools/types.js";
import { createStripeTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type StripeConfig } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ServerContext {
  server: Server;
  stripe: StripeClient;
  logger: Logger;
  config: StripeConfig;
}

function createStripeClient(config: StripeConfig): StripeClient {
  const { apiKey, baseUrl } = config;

  async function stripeRequest<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = `${baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const options: RequestInit = { method, headers };

    if (body) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
      options.body = params.toString();
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Stripe API error (${response.status}): ${errorBody}`);
    }
    return response.json() as Promise<T>;
  }

  return {
    async listCustomers(params) {
      const query = new URLSearchParams();
      if (params?.limit) query.set("limit", String(params.limit));
      if (params?.email) query.set("email", params.email);
      const qs = query.toString();
      return stripeRequest("GET", `/customers${qs ? `?${qs}` : ""}`);
    },

    async getCustomer(id: string) {
      return stripeRequest("GET", `/customers/${id}`);
    },

    async createCustomer(data) {
      return stripeRequest("POST", "/customers", data as Record<string, unknown>);
    },

    async listCharges(params) {
      const query = new URLSearchParams();
      if (params?.limit) query.set("limit", String(params.limit));
      if (params?.customer) query.set("customer", params.customer);
      const qs = query.toString();
      return stripeRequest("GET", `/charges${qs ? `?${qs}` : ""}`);
    },

    async createCharge(data) {
      return stripeRequest("POST", "/charges", data as Record<string, unknown>);
    },

    async listProducts(params) {
      const query = new URLSearchParams();
      if (params?.limit) query.set("limit", String(params.limit));
      const qs = query.toString();
      return stripeRequest("GET", `/products${qs ? `?${qs}` : ""}`);
    },

    async createProduct(data) {
      return stripeRequest("POST", "/products", data as Record<string, unknown>);
    },

    async listSubscriptions(params) {
      const query = new URLSearchParams();
      if (params?.limit) query.set("limit", String(params.limit));
      if (params?.customer) query.set("customer", params.customer);
      if (params?.status) query.set("status", params.status);
      const qs = query.toString();
      return stripeRequest("GET", `/subscriptions${qs ? `?${qs}` : ""}`);
    },
  };
}

export async function createServerContext(config?: Partial<StripeConfig>): Promise<ServerContext> {
  const fullConfig = config?.apiKey
    ? {
        apiKey: config.apiKey,
        apiVersion: config.apiVersion ?? "2024-12-18.acacia",
        baseUrl: config.baseUrl ?? "https://api.stripe.com/v1",
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({ name: "stripe", level: fullConfig.logLevel });
  const stripe = createStripeClient(fullConfig);
  const tools = createStripeTools(stripe);
  const server = createMcpServer("@mcp-toolkit/stripe", "0.1.0", tools, logger);

  return { server, stripe, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "Stripe", {
    transport: ctx.config.transport,
    port: ctx.config.port,
  });
}
