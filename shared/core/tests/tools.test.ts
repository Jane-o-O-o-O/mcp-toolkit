import { describe, it, expect } from "vitest";
import {
  textResult,
  jsonResult,
  errorResult,
  safeRun,
  safeRunSync,
} from "../src/tools.js";

describe("tools helpers", () => {
  describe("textResult", () => {
    it("should create a text content result", () => {
      const result = textResult("hello");
      expect(result).toEqual({
        content: [{ type: "text", text: "hello" }],
      });
      expect(result.isError).toBeUndefined();
    });
  });

  describe("jsonResult", () => {
    it("should serialize data as formatted JSON", () => {
      const result = jsonResult({ foo: "bar", num: 42 });
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain('"foo": "bar"');
      expect(result.content[0].text).toContain('"num": 42');
    });

    it("should handle arrays", () => {
      const result = jsonResult([1, 2, 3]);
      expect(result.content[0].text).toBe("[\n  1,\n  2,\n  3\n]");
    });

    it("should handle null", () => {
      const result = jsonResult(null);
      expect(result.content[0].text).toBe("null");
    });
  });

  describe("errorResult", () => {
    it("should create an error result", () => {
      const result = errorResult("something broke");
      expect(result).toEqual({
        content: [{ type: "text", text: "Error: something broke" }],
        isError: true,
      });
    });
  });

  describe("safeRun", () => {
    it("should return text result on success", async () => {
      const result = await safeRun(async () => "ok");
      expect(result.content[0].text).toBe("ok");
      expect(result.isError).toBeUndefined();
    });

    it("should use format function when provided", async () => {
      const result = await safeRun(
        async () => 42,
        (n) => `count: ${n}`,
      );
      expect(result.content[0].text).toBe("count: 42");
    });

    it("should catch errors and return error result", async () => {
      const result = await safeRun(async () => {
        throw new Error("boom");
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe("Error: boom");
    });

    it("should handle non-Error thrown values", async () => {
      const result = await safeRun(async () => {
        throw "string error";
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe("Error: string error");
    });
  });

  describe("safeRunSync", () => {
    it("should return text result on success", () => {
      const result = safeRunSync(() => 42);
      expect(result.content[0].text).toBe("42");
    });

    it("should use format function", () => {
      const result = safeRunSync(
        () => [1, 2, 3],
        (arr) => `items: ${arr.length}`,
      );
      expect(result.content[0].text).toBe("items: 3");
    });

    it("should catch errors", () => {
      const result = safeRunSync(() => {
        throw new Error("fail");
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe("Error: fail");
    });

    it("should handle non-Error thrown values", () => {
      const result = safeRunSync(() => {
        throw 123;
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe("Error: 123");
    });
  });
});
