import { describe, it, expect, vi } from "vitest";
import { createStripeTools } from "../src/tools/index.js";
import type { StripeClient } from "../src/tools/types.js";

function mockStripeClient(overrides: Partial<StripeClient> = {}): StripeClient {
  return {
    listCustomers: vi.fn().mockResolvedValue({
      data: [
        { id: "cus_001", name: "Alice", email: "alice@example.com", created: 1700000000 },
        { id: "cus_002", name: "Bob", email: "bob@example.com", created: 1700001000 },
      ],
      has_more: false,
    }),
    getCustomer: vi.fn().mockResolvedValue({
      id: "cus_001",
      name: "Alice",
      email: "alice@example.com",
      created: 1700000000,
      description: "Premium customer",
    }),
    createCustomer: vi.fn().mockResolvedValue({
      id: "cus_003",
      name: "Charlie",
      email: "charlie@example.com",
      created: 1700002000,
    }),
    listCharges: vi.fn().mockResolvedValue({
      data: [
        { id: "ch_001", amount: 2000, currency: "usd", customer: "cus_001", status: "succeeded", created: 1700000100 },
        { id: "ch_002", amount: 5000, currency: "usd", customer: "cus_002", status: "succeeded", created: 1700001100 },
      ],
      has_more: false,
    }),
    createCharge: vi.fn().mockResolvedValue({
      id: "ch_003",
      amount: 3000,
      currency: "usd",
      customer: "cus_001",
      status: "succeeded",
      created: 1700002100,
    }),
    listProducts: vi.fn().mockResolvedValue({
      data: [
        { id: "prod_001", name: "Basic Plan", active: true, description: "Basic tier", created: 1700000000 },
        { id: "prod_002", name: "Pro Plan", active: true, description: "Pro tier", created: 1700001000 },
      ],
      has_more: false,
    }),
    createProduct: vi.fn().mockResolvedValue({
      id: "prod_003",
      name: "Enterprise Plan",
      active: true,
      description: "Enterprise tier",
      created: 1700002000,
    }),
    listSubscriptions: vi.fn().mockResolvedValue({
      data: [
        {
          id: "sub_001",
          customer: "cus_001",
          status: "active",
          current_period_start: 1700000000,
          current_period_end: 1702592000,
        },
      ],
      has_more: false,
    }),
    ...overrides,
  };
}

describe("Stripe tools", () => {
  it("should have 8 tools", () => {
    const tools = createStripeTools(mockStripeClient());
    expect(tools).toHaveLength(8);
  });

  describe("stripe_list_customers", () => {
    it("should list customers", async () => {
      const client = mockStripeClient();
      const tools = createStripeTools(client);
      const tool = tools.find((t) => t.definition.name === "stripe_list_customers")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Alice");
      expect(result.content[0].text).toContain("Bob");
      expect(client.listCustomers).toHaveBeenCalled();
    });
  });

  describe("stripe_get_customer", () => {
    it("should get a customer by id", async () => {
      const client = mockStripeClient();
      const tools = createStripeTools(client);
      const tool = tools.find((t) => t.definition.name === "stripe_get_customer")!;

      const result = await tool.handler({ id: "cus_001" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("cus_001");
      expect(result.content[0].text).toContain("Alice");
      expect(client.getCustomer).toHaveBeenCalledWith("cus_001");
    });
  });

  describe("stripe_create_customer", () => {
    it("should create a customer", async () => {
      const client = mockStripeClient();
      const tools = createStripeTools(client);
      const tool = tools.find((t) => t.definition.name === "stripe_create_customer")!;

      const result = await tool.handler({ name: "Charlie", email: "charlie@example.com" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("cus_003");
      expect(result.content[0].text).toContain("Charlie");
      expect(client.createCustomer).toHaveBeenCalledWith({
        name: "Charlie",
        email: "charlie@example.com",
        description: undefined,
      });
    });
  });

  describe("stripe_list_charges", () => {
    it("should list charges", async () => {
      const client = mockStripeClient();
      const tools = createStripeTools(client);
      const tool = tools.find((t) => t.definition.name === "stripe_list_charges")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("ch_001");
      expect(result.content[0].text).toContain("2000");
      expect(client.listCharges).toHaveBeenCalled();
    });
  });

  describe("stripe_create_charge", () => {
    it("should create a charge", async () => {
      const client = mockStripeClient();
      const tools = createStripeTools(client);
      const tool = tools.find((t) => t.definition.name === "stripe_create_charge")!;

      const result = await tool.handler({ amount: 3000, currency: "usd", customer: "cus_001" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("ch_003");
      expect(result.content[0].text).toContain("3000");
      expect(client.createCharge).toHaveBeenCalledWith({
        amount: 3000,
        currency: "usd",
        customer: "cus_001",
        description: undefined,
      });
    });
  });

  describe("stripe_list_products", () => {
    it("should list products", async () => {
      const client = mockStripeClient();
      const tools = createStripeTools(client);
      const tool = tools.find((t) => t.definition.name === "stripe_list_products")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Basic Plan");
      expect(result.content[0].text).toContain("Pro Plan");
      expect(client.listProducts).toHaveBeenCalled();
    });
  });

  describe("stripe_create_product", () => {
    it("should create a product", async () => {
      const client = mockStripeClient();
      const tools = createStripeTools(client);
      const tool = tools.find((t) => t.definition.name === "stripe_create_product")!;

      const result = await tool.handler({ name: "Enterprise Plan", description: "Enterprise tier" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("prod_003");
      expect(result.content[0].text).toContain("Enterprise Plan");
      expect(client.createProduct).toHaveBeenCalledWith({
        name: "Enterprise Plan",
        description: "Enterprise tier",
        active: undefined,
      });
    });
  });

  describe("stripe_list_subscriptions", () => {
    it("should list subscriptions", async () => {
      const client = mockStripeClient();
      const tools = createStripeTools(client);
      const tool = tools.find((t) => t.definition.name === "stripe_list_subscriptions")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("sub_001");
      expect(result.content[0].text).toContain("active");
      expect(client.listSubscriptions).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should return error on API failure", async () => {
      const client = mockStripeClient({
        listCustomers: vi.fn().mockRejectedValue(new Error("Invalid API key")),
      });
      const tools = createStripeTools(client);
      const tool = tools.find((t) => t.definition.name === "stripe_list_customers")!;

      const result = await tool.handler({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Invalid API key");
    });
  });
});
