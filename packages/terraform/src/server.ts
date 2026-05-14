import type { TerraformClient } from "./tools/types.js";
import { createTerraformTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type TerraformConfig } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface ServerContext {
  server: Server;
  tf: TerraformClient;
  logger: Logger;
  config: TerraformConfig;
}

function parsePlanOutput(stdout: string) {
  const addMatch = stdout.match(/(\d+) to add/);
  const changeMatch = stdout.match(/(\d+) to change/);
  const destroyMatch = stdout.match(/(\d+) to destroy/);
  const additions = addMatch ? parseInt(addMatch[1], 10) : 0;
  const changes = changeMatch ? parseInt(changeMatch[1], 10) : 0;
  const destructions = destroyMatch ? parseInt(destroyMatch[1], 10) : 0;
  return { additions, changes, destructions };
}

async function runTerraform(
  binary: string,
  workDir: string,
  args: string[],
  varFile?: string,
): Promise<{ stdout: string; stderr: string }> {
  const fullArgs = [...args];
  if (varFile && (args[0] === "plan" || args[0] === "apply" || args[0] === "destroy")) {
    fullArgs.push("-var-file", varFile);
  }
  try {
    return await execFileAsync(binary, fullArgs, { cwd: workDir, maxBuffer: 10 * 1024 * 1024 });
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    // terraform plan returns exit code 2 when there are changes
    if (e.stdout) return { stdout: e.stdout, stderr: e.stderr ?? "" };
    throw err;
  }
}

function buildVarArgs(vars?: Record<string, string>): string[] {
  if (!vars) return [];
  return Object.entries(vars).flatMap(([k, v]) => ["-var", `${k}=${v}`]);
}

function createTerraformClient(config: TerraformConfig): TerraformClient {
  const { binary, workDir, varFile } = config;
  let currentWorkspace = "default";

  return {
    async listWorkspaces() {
      const { stdout } = await runTerraform(binary, workDir, ["workspace", "list"]);
      return stdout
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const current = line.startsWith("*");
          const name = line.replace(/^\*?\s*/, "").trim();
          return { name, current };
        });
    },

    async selectWorkspace(name: string) {
      const previous = currentWorkspace;
      await runTerraform(binary, workDir, ["workspace", "select", name]);
      currentWorkspace = name;
      return { previous, current: name };
    },

    async plan(vars) {
      const args = ["plan", "-no-color", ...buildVarArgs(vars)];
      const { stdout } = await runTerraform(binary, workDir, args, varFile);
      const { additions, changes, destructions } = parsePlanOutput(stdout);
      const hasChanges = additions + changes + destructions > 0;
      const summary = hasChanges
        ? `Plan: ${additions} to add, ${changes} to change, ${destructions} to destroy`
        : "No changes. Infrastructure is up-to-date.";
      return { summary, additions, changes, destructions, hasChanges, raw: stdout };
    },

    async apply(vars, autoApprove) {
      const args = ["apply", "-no-color"];
      if (autoApprove || config.autoApprove) args.push("-auto-approve");
      args.push(...buildVarArgs(vars));
      const { stdout } = await runTerraform(binary, workDir, args, varFile);
      const { additions, changes, destructions } = parsePlanOutput(stdout);

      // Get outputs after apply
      let outputs: Record<string, unknown> = {};
      try {
        const outResult = await this.output();
        outputs = Object.fromEntries(outResult.map((o) => [o.name, o.value]));
      } catch { /* ignore */ }

      const summary = `Applied: ${additions} added, ${changes} changed, ${destructions} destroyed`;
      return { summary, additions, changes, destructions, outputs, raw: stdout };
    },

    async destroy(vars, autoApprove) {
      const args = ["destroy", "-no-color"];
      if (autoApprove || config.autoApprove) args.push("-auto-approve");
      args.push(...buildVarArgs(vars));
      const { stdout } = await runTerraform(binary, workDir, args, varFile);
      const { destructions } = parsePlanOutput(stdout);
      return { summary: `Destroyed ${destructions} resources`, destructions, raw: stdout };
    },

    async output() {
      const { stdout } = await runTerraform(binary, workDir, ["output", "-json"]);
      const parsed = JSON.parse(stdout || "{}");
      return Object.entries(parsed).map(([name, val]: [string, unknown]) => {
        const v = val as { value?: unknown; sensitive?: boolean };
        return { name, value: v.value ?? val, sensitive: v.sensitive ?? false };
      });
    },

    async stateList() {
      const { stdout } = await runTerraform(binary, workDir, ["state", "list"]);
      return stdout.split("\n").filter((line) => line.trim());
    },

    async stateShow(address: string) {
      const { stdout } = await runTerraform(binary, workDir, ["state", "show", "-no-color", address]);
      return stdout;
    },
  };
}

export async function createServerContext(config?: Partial<TerraformConfig>): Promise<ServerContext> {
  const fullConfig = config?.workDir
    ? {
        workDir: config.workDir,
        binary: config.binary ?? "terraform",
        varFile: config.varFile,
        autoApprove: config.autoApprove ?? false,
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({ name: "terraform", level: fullConfig.logLevel });
  const tf = createTerraformClient(fullConfig);
  const tools = createTerraformTools(tf);
  const server = createMcpServer("@mcp-toolkit/terraform", "0.1.0", tools, logger);

  return { server, tf, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "Terraform", {
    transport: ctx.config.transport,
    port: ctx.config.port,
  });
}
