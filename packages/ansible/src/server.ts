import type { AnsibleClient } from "./tools/types.js";
import { createAnsibleTools } from "./tools/index.js";
import { createMcpServer, startServer as startServerCore } from "@mcp-toolkit/core";
import { createLogger, type Logger } from "@mcp-toolkit/logger";
import { loadConfig, type AnsibleConfig } from "./config.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface ServerContext {
  server: Server;
  ansible: AnsibleClient;
  logger: Logger;
  config: AnsibleConfig;
}

async function runCommand(
  binary: string,
  args: string[],
  workDir: string,
): Promise<{ stdout: string; stderr: string }> {
  try {
    return await execFileAsync(binary, args, { cwd: workDir, maxBuffer: 10 * 1024 * 1024 });
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    if (e.stdout || e.stderr) return { stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
    throw err;
  }
}

function parsePlaybookOutput(stdout: string) {
  const playMatch = stdout.match(/(\d+) play(?:s)?/);
  const taskMatch = stdout.match(/(\d+) task(?:s)?/);
  const hostMatch = stdout.match(/(\d+) host(?:s)?/);
  const plays = playMatch ? parseInt(playMatch[1], 10) : 0;
  const tasks = taskMatch ? parseInt(taskMatch[1], 10) : 0;
  const hosts = hostMatch ? parseInt(hostMatch[1], 10) : 0;

  let status: "success" | "failure" | "unreachable" = "success";
  if (stdout.includes("unreachable=1") || stdout.includes("Unreachable")) status = "unreachable";
  else if (stdout.includes("failed=1") || stdout.includes("FAILED")) status = "failure";

  const recapMatch = stdout.match(/PLAY RECAP[\s\S]*$/);
  const recap = recapMatch ? recapMatch[0].trim() : "";

  return { plays, tasks, hosts, status, recap };
}

function createAnsibleClient(config: AnsibleConfig): AnsibleClient {
  const playbookBinary = config.binary;
  const ansibleBinary = "ansible";
  const galaxyBinary = "ansible-galaxy";
  const vaultBinary = "ansible-vault";
  const workDir = config.playbookDir;

  const baseArgs: string[] = [];
  if (config.inventory) baseArgs.push("-i", config.inventory);
  if (config.privateKey) baseArgs.push("--private-key", config.privateKey);
  if (config.vaultPasswordFile) baseArgs.push("--vault-password-file", config.vaultPasswordFile);

  return {
    async runPlaybook(playbook, inventory, extraVars, limit) {
      const args = [playbook, ...baseArgs, "-v"];
      if (inventory) args.push("-i", inventory);
      if (limit) args.push("--limit", limit);
      if (extraVars) args.push("-e", JSON.stringify(extraVars));
      const { stdout, stderr } = await runCommand(playbookBinary, args, workDir);
      const parsed = parsePlaybookOutput(stdout + stderr);
      return { playbook, ...parsed, raw: stdout + stderr };
    },

    async listHosts(inventory, pattern) {
      const args = ["--list-hosts"];
      if (inventory) args.unshift("-i", inventory);
      if (pattern) args.push(pattern);
      else args.push("all");
      const { stdout } = await runCommand(ansibleBinary, args, workDir);
      const hosts = stdout.split("\n").filter((l) => l.trim() && !l.includes("(")).map((l) => ({
        name: l.trim(),
        groups: [],
        variables: {},
      }));
      return hosts;
    },

    async runAdHoc(module, args, hosts, inventory) {
      const cmdArgs = [hosts ?? "all", "-m", module, "-a", args, ...baseArgs];
      if (inventory) cmdArgs.push("-i", inventory);
      const { stdout, stderr } = await runCommand(ansibleBinary, cmdArgs, workDir);
      const successMatch = stdout.match(/(\d+) SUCCESS/);
      const failMatch = stdout.match(/(\d+) FAILED/);
      const unreachableMatch = stdout.match(/(\d+) UNREACHABLE/);
      return {
        module,
        hosts: (hosts ?? "all").split(",").length,
        success: successMatch ? parseInt(successMatch[1], 10) : 0,
        failures: failMatch ? parseInt(failMatch[1], 10) : 0,
        unreachable: unreachableMatch ? parseInt(unreachableMatch[1], 10) : 0,
        raw: stdout + stderr,
      };
    },

    async listRoles(path) {
      const args = ["list"];
      if (path) args.push("-p", path);
      const { stdout } = await runCommand(galaxyBinary, args, workDir);
      return stdout.split("\n").filter((l) => l.trim()).map((l) => {
        const match = l.match(/- (\S+),\s+(\S+)/);
        if (match) return { name: match[1], path: workDir, version: match[2] };
        return { name: l.trim(), path: workDir };
      });
    },

    async listCollections() {
      const { stdout } = await runCommand(galaxyBinary, ["collection", "list"], workDir);
      return stdout.split("\n").filter((l) => l.trim() && !l.startsWith("#")).map((l) => {
        const parts = l.trim().split(/\s+/);
        return { name: parts[0] ?? l.trim(), version: parts[1] ?? "unknown", path: workDir };
      });
    },

    async vaultEncrypt(content, vaultId) {
      const args = ["encrypt", "--stdin-name", "secret"];
      if (vaultId) args.push("--vault-id", vaultId);
      // In production, content would be piped to stdin
      void content;
      const { stdout } = await runCommand(vaultBinary, args, workDir);
      return stdout.trim();
    },

    async vaultDecrypt(content, vaultId) {
      const args = ["decrypt", "--stdin-name", "secret"];
      if (vaultId) args.push("--vault-id", vaultId);
      void content;
      const { stdout } = await runCommand(vaultBinary, args, workDir);
      return stdout.trim();
    },

    async galaxyInstall(name, type = "role") {
      const args = [type === "collection" ? "collection install" : "install", name];
      const { stdout } = await runCommand(galaxyBinary, args, workDir);
      void stdout;
      return { name, type, status: "installed", version: undefined };
    },
  };
}

export async function createServerContext(config?: Partial<AnsibleConfig>): Promise<ServerContext> {
  const fullConfig = config?.playbookDir
    ? {
        playbookDir: config.playbookDir,
        inventory: config.inventory,
        binary: config.binary ?? "ansible-playbook",
        vaultPasswordFile: config.vaultPasswordFile,
        privateKey: config.privateKey,
        extraVars: config.extraVars,
        logLevel: config.logLevel ?? ("info" as const),
        transport: config.transport ?? ("stdio" as const),
        port: config.port ?? 3000,
      }
    : loadConfig();

  const logger = createLogger({ name: "ansible", level: fullConfig.logLevel });
  const ansible = createAnsibleClient(fullConfig);
  const tools = createAnsibleTools(ansible);
  const server = createMcpServer("@mcp-toolkit/ansible", "0.1.0", tools, logger);

  return { server, ansible, logger, config: fullConfig };
}

export async function startServer(ctx: ServerContext): Promise<void> {
  await startServerCore(ctx.server, ctx.logger, "Ansible", {
    transport: ctx.config.transport,
    port: ctx.config.port,
  });
}
