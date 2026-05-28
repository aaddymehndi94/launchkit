import { spawn } from "node:child_process";

type CommandResult = {
  ok: boolean;
  stdout: string;
  stderr: string;
  code: number | null;
  error?: NodeJS.ErrnoException;
};

const isWindows = process.platform === "win32";

const dockerVersion = await run("docker", ["--version"]);
if (!dockerVersion.ok) {
  fail(
    [
      "Docker CLI is not available in this terminal.",
      "",
      "Install Docker Desktop, then close and reopen PowerShell:",
      "  winget install --id Docker.DockerDesktop -e",
      "",
      "After reopening PowerShell, verify:",
      "  docker --version",
      "  docker compose version"
    ],
    dockerVersion
  );
}

const composeVersion = await run("docker", ["compose", "version"]);
if (!composeVersion.ok) {
  fail(
    [
      "Docker is installed, but Docker Compose is not available.",
      "",
      "Update Docker Desktop, then verify:",
      "  docker compose version"
    ],
    composeVersion
  );
}

const dockerInfo = await run("docker", ["info"]);
if (!dockerInfo.ok) {
  fail(
    [
      "Docker is installed, but the Docker daemon is not running.",
      "",
      ...(isWindows
        ? [
            "On Windows:",
            "  1. Open Docker Desktop from the Start menu.",
            "  2. Wait until Docker Desktop says it is running.",
            "  3. Open a new PowerShell window.",
            "  4. Run: docker info",
            "",
            "If Docker Desktop will not start:",
            "  wsl --status",
            "  wsl --install",
            "  wsl --update",
            "  Restart Windows after installing WSL.",
            "",
            "The Windows error npipe:////./pipe/docker_engine means this exact issue."
          ]
        : [
            "Start Docker, then verify:",
            "  docker info"
          ])
    ],
    dockerInfo
  );
}

console.log("Docker is available and running.");
console.log(dockerVersion.stdout.trim());
console.log(composeVersion.stdout.trim());

function run(command: string, args: string[]): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      shell: isWindows,
      stdio: ["ignore", "pipe", "pipe"]
    });

    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));

    child.on("error", (error: NodeJS.ErrnoException) => {
      resolve({
        ok: false,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
        code: null,
        error
      });
    });

    child.on("close", (code) => {
      resolve({
        ok: code === 0,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
        code
      });
    });
  });
}

function fail(message: string[], result: CommandResult): never {
  console.error("");
  console.error(message.join("\n"));

  const details = [result.error?.message, result.stderr.trim(), result.stdout.trim()]
    .filter(Boolean)
    .join("\n");

  if (details) {
    console.error("");
    console.error("Docker details:");
    console.error(details);
  }

  console.error("");
  process.exit(1);
}
