import { describe, it, expect, vi } from "vitest";
import { createTerraformTools } from "../src/tools/index.js";
import type { TerraformClient } from "../src/tools/types.js";

function mockTerraformClient(overrides: Partial<TerraformClient> = {}): TerraformClient {
  return {
    listWorkspaces: vi.fn().mockResolvedValue([
      { name: "default", current: true },
      { name: "staging", current: false },
      { name: "production", current: false },
    ]),
    selectWorkspace: vi.fn().mockResolvedValue({ previous: "default", current: "staging" }),
    plan: vi.fn().mockResolvedValue({
      summary: "Plan: 2 to add, 1 to change, 0 to destroy",
      additions: 2,
      changes: 1,
      destructions: 0,
      hasChanges: true,
      raw: "Terraform will perform the following actions:\n  # aws_instance.web will be created\n  + resource \"aws_instance\" \"web\" {}",
    }),
    apply: vi.fn().mockResolvedValue({
      summary: "Applied: 2 added, 1 changed, 0 destroyed",
      additions: 2,
      changes: 1,
      destructions: 0,
      outputs: { instance_ip: "10.0.0.1" },
      raw: "Apply complete! Resources: 2 added, 1 changed, 0 destroyed.",
    }),
    destroy: vi.fn().mockResolvedValue({
      summary: "Destroyed 3 resources",
      destructions: 3,
      raw: "Destroy complete! Resources: 3 destroyed.",
    }),
    output: vi.fn().mockResolvedValue([
      { name: "instance_ip", value: "10.0.0.1", sensitive: false },
      { name: "db_password", value: "secret123", sensitive: true },
    ]),
    stateList: vi.fn().mockResolvedValue([
      "aws_instance.web",
      "aws_s3_bucket.data",
      "aws_rds_database.main",
    ]),
    stateShow: vi.fn().mockResolvedValue("aws_instance.web:\n  id = i-1234567890\n  ami = ami-12345\n  instance_type = t3.micro"),
    ...overrides,
  };
}

describe("Terraform tools", () => {
  it("should have 8 tools", () => {
    const tools = createTerraformTools(mockTerraformClient());
    expect(tools).toHaveLength(8);
  });

  describe("list_workspaces", () => {
    it("should list all workspaces", async () => {
      const client = mockTerraformClient();
      const tools = createTerraformTools(client);
      const tool = tools.find((t) => t.definition.name === "list_workspaces")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("default");
      expect(result.content[0].text).toContain("staging");
      expect(result.content[0].text).toContain("production");
    });
  });

  describe("select_workspace", () => {
    it("should switch workspace", async () => {
      const client = mockTerraformClient();
      const tools = createTerraformTools(client);
      const tool = tools.find((t) => t.definition.name === "select_workspace")!;

      const result = await tool.handler({ name: "staging" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("staging");
      expect(client.selectWorkspace).toHaveBeenCalledWith("staging");
    });
  });

  describe("plan", () => {
    it("should run plan and return summary", async () => {
      const client = mockTerraformClient();
      const tools = createTerraformTools(client);
      const tool = tools.find((t) => t.definition.name === "plan")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("2 to add");
      expect(result.content[0].text).toContain("1 to change");
    });

    it("should pass variables to plan", async () => {
      const client = mockTerraformClient();
      const tools = createTerraformTools(client);
      const tool = tools.find((t) => t.definition.name === "plan")!;

      await tool.handler({ vars: { region: "us-east-1", instance_count: "3" } });
      expect(client.plan).toHaveBeenCalledWith({ region: "us-east-1", instance_count: "3" });
    });
  });

  describe("apply", () => {
    it("should run apply", async () => {
      const client = mockTerraformClient();
      const tools = createTerraformTools(client);
      const tool = tools.find((t) => t.definition.name === "apply")!;

      const result = await tool.handler({ auto_approve: true });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("2 added");
      expect(client.apply).toHaveBeenCalledWith(undefined, true);
    });
  });

  describe("destroy", () => {
    it("should run destroy", async () => {
      const client = mockTerraformClient();
      const tools = createTerraformTools(client);
      const tool = tools.find((t) => t.definition.name === "destroy")!;

      const result = await tool.handler({ auto_approve: true });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Destroyed 3");
      expect(client.destroy).toHaveBeenCalledWith(undefined, true);
    });
  });

  describe("output", () => {
    it("should list outputs", async () => {
      const client = mockTerraformClient();
      const tools = createTerraformTools(client);
      const tool = tools.find((t) => t.definition.name === "output")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("instance_ip");
      expect(result.content[0].text).toContain("db_password");
    });
  });

  describe("state_list", () => {
    it("should list state resources", async () => {
      const client = mockTerraformClient();
      const tools = createTerraformTools(client);
      const tool = tools.find((t) => t.definition.name === "state_list")!;

      const result = await tool.handler({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("aws_instance.web");
      expect(result.content[0].text).toContain("aws_s3_bucket.data");
    });
  });

  describe("state_show", () => {
    it("should show resource details", async () => {
      const client = mockTerraformClient();
      const tools = createTerraformTools(client);
      const tool = tools.find((t) => t.definition.name === "state_show")!;

      const result = await tool.handler({ address: "aws_instance.web" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("i-1234567890");
      expect(client.stateShow).toHaveBeenCalledWith("aws_instance.web");
    });
  });

  describe("error handling", () => {
    it("should return error on API failure", async () => {
      const client = mockTerraformClient({
        plan: vi.fn().mockRejectedValue(new Error("terraform not initialized")),
      });
      const tools = createTerraformTools(client);
      const tool = tools.find((t) => t.definition.name === "plan")!;

      const result = await tool.handler({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("terraform not initialized");
    });
  });
});
