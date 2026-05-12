import { describe, it, expect } from "vitest";
import {
  textResult,
  jsonResult,
  errorResult,
  safeRun,
  validateName,
} from "../src/helpers.js";

describe("textResult", () => {
  it("creates a text content result", () => {
    const result = textResult("hello");
    expect(result.content).toEqual([{ type: "text", text: "hello" }]);
    expect(result.isError).toBeUndefined();
  });
});

describe("jsonResult", () => {
  it("serializes objects to formatted JSON", () => {
    const result = jsonResult({ a: 1, b: "two" });
    expect(JSON.parse(result.content[0].text)).toEqual({ a: 1, b: "two" });
  });

  it("handles arrays", () => {
    const result = jsonResult([1, 2, 3]);
    expect(JSON.parse(result.content[0].text)).toEqual([1, 2, 3]);
  });

  it("handles null", () => {
    const result = jsonResult(null);
    expect(result.content[0].text).toBe("null");
  });
});

describe("errorResult", () => {
  it("creates an error result with Error prefix", () => {
    const result = errorResult("something broke");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Error: something broke");
  });
});

describe("safeRun", () => {
  it("returns text result for string return", async () => {
    const result = await safeRun(async () => "ok");
    expect(result.content[0].text).toBe("ok");
    expect(result.isError).toBeUndefined();
  });

  it("returns JSON result for object return", async () => {
    const result = await safeRun(async () => ({ count: 42 }));
    expect(JSON.parse(result.content[0].text)).toEqual({ count: 42 });
  });

  it("uses custom format function", async () => {
    const result = await safeRun(
      async () => 42,
      (v) => `count: ${v}`,
    );
    expect(result.content[0].text).toBe("count: 42");
  });

  it("catches errors and returns error result", async () => {
    const result = await safeRun(async () => {
      throw new Error("boom");
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Error: boom");
  });

  it("handles non-Error thrown values", async () => {
    const result = await safeRun(async () => {
      throw "string error";
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Error: string error");
  });

  it("supports sync functions", async () => {
    const result = await safeRun(() => 123);
    expect(result.content[0].text).toBe("123");
  });
});

describe("validateName", () => {
  it("accepts valid identifiers", () => {
    expect(() => validateName("users", "table")).not.toThrow();
    expect(() => validateName("_private", "table")).not.toThrow();
    expect(() => validateName("my_table_2", "table")).not.toThrow();
    expect(() => validateName("schema.table", "table")).not.toThrow();
  });

  it("rejects names with dangerous characters", () => {
    expect(() => validateName("users; DROP TABLE", "table")).toThrow("Invalid table");
    expect(() => validateName("../../../etc/passwd", "path")).toThrow("Invalid path");
    expect(() => validateName("", "name")).toThrow("Invalid name");
    expect(() => validateName("123abc", "name")).toThrow("Invalid name");
  });
});
