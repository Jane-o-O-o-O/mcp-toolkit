import type { StripeClient } from "./types.js";
import type { McpTool } from "@mcp-toolkit/core";
import { safeRun } from "@mcp-toolkit/core";

export function createStripeTools(client: StripeClient): McpTool[] {
  const listCustomersTool: McpTool = {
    definition: {
      name: "stripe_list_customers",
      description: "List Stripe customers. Optionally filter by email and limit results.",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Maximum number of customers to return (default: 10)" },
          email: { type: "string", description: "Filter customers by email address" },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.listCustomers({
            limit: args.limit as number | undefined,
            email: args.email as string | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const getCustomerTool: McpTool = {
    definition: {
      name: "stripe_get_customer",
      description: "Retrieve a Stripe customer by ID.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Stripe customer ID (e.g. cus_xxx)" },
        },
        required: ["id"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () => client.getCustomer(args.id as string),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const createCustomerTool: McpTool = {
    definition: {
      name: "stripe_create_customer",
      description: "Create a new Stripe customer.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Customer name" },
          email: { type: "string", description: "Customer email address" },
          description: { type: "string", description: "Customer description" },
        },
        required: ["name"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.createCustomer({
            name: args.name as string,
            email: args.email as string | undefined,
            description: args.description as string | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const listChargesTool: McpTool = {
    definition: {
      name: "stripe_list_charges",
      description: "List Stripe charges. Optionally filter by customer and limit results.",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Maximum number of charges to return (default: 10)" },
          customer: { type: "string", description: "Filter charges by customer ID" },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.listCharges({
            limit: args.limit as number | undefined,
            customer: args.customer as string | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const createChargeTool: McpTool = {
    definition: {
      name: "stripe_create_charge",
      description: "Create a new Stripe charge.",
      inputSchema: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Amount in cents (e.g. 1000 for $10.00)" },
          currency: { type: "string", description: "Three-letter ISO currency code (e.g. usd)" },
          customer: { type: "string", description: "Stripe customer ID to charge" },
          description: { type: "string", description: "Description of the charge" },
        },
        required: ["amount", "currency"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.createCharge({
            amount: args.amount as number,
            currency: args.currency as string,
            customer: args.customer as string | undefined,
            description: args.description as string | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const listProductsTool: McpTool = {
    definition: {
      name: "stripe_list_products",
      description: "List Stripe products. Optionally limit results.",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Maximum number of products to return (default: 10)" },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.listProducts({
            limit: args.limit as number | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const createProductTool: McpTool = {
    definition: {
      name: "stripe_create_product",
      description: "Create a new Stripe product.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Product name" },
          description: { type: "string", description: "Product description" },
          active: { type: "boolean", description: "Whether the product is active (default: true)" },
        },
        required: ["name"],
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.createProduct({
            name: args.name as string,
            description: args.description as string | undefined,
            active: args.active as boolean | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  const listSubscriptionsTool: McpTool = {
    definition: {
      name: "stripe_list_subscriptions",
      description: "List Stripe subscriptions. Optionally filter by customer and status.",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Maximum number of subscriptions to return (default: 10)" },
          customer: { type: "string", description: "Filter subscriptions by customer ID" },
          status: { type: "string", description: "Filter by subscription status (e.g. active, canceled, past_due)" },
        },
      },
    },
    handler: async (args) =>
      safeRun(
        async () =>
          client.listSubscriptions({
            limit: args.limit as number | undefined,
            customer: args.customer as string | undefined,
            status: args.status as string | undefined,
          }),
        (r) => JSON.stringify(r, null, 2),
      ),
  };

  return [
    listCustomersTool,
    getCustomerTool,
    createCustomerTool,
    listChargesTool,
    createChargeTool,
    listProductsTool,
    createProductTool,
    listSubscriptionsTool,
  ];
}
