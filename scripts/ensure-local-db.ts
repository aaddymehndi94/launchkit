import { spawn } from "node:child_process";

await run("pnpm", ["db:local:up"]);
await waitForPostgres();

const ensureResult = await run("pnpm", ["--filter", "@launchkit/db", "db:ensure:local"], {
  allowFailure: true
});

if (ensureResult === 3) {
  console.log("");
  console.log("Local migration history changed. Resetting only the local Docker Postgres volume.");
  await run("docker", ["compose", "-f", "docker-compose.local.yml", "down", "-v"]);
  await run("pnpm", ["db:local:up"]);
  await waitForPostgres();
  await run("pnpm", ["--filter", "@launchkit/db", "db:ensure:local"]);
} else if (ensureResult !== 0) {
  process.exit(ensureResult);
}

async function waitForPostgres() {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    const result = await run(
      "docker",
      ["compose", "-f", "docker-compose.local.yml", "exec", "-T", "postgres", "pg_isready", "-U", "launchkit", "-d", "launchkit"],
      { allowFailure: true, silent: true }
    );

    if (result === 0) {
      return;
    }

    await delay(1_000);
  }

  throw new Error("Local Postgres did not become ready within 60 seconds.");
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function run(command: string, args: string[], options: { allowFailure?: boolean; silent?: boolean } = {}) {
  return new Promise<number>((resolve, reject) => {
    const spawnInput = resolveCommand(command, args);
    const child = spawn(spawnInput.command, spawnInput.args, {
      stdio: options.silent ? "ignore" : "inherit",
      shell: false
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      const exitCode = code ?? 1;
      if (exitCode === 0 || options.allowFailure) {
        resolve(exitCode);
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${exitCode}.`));
    });
  });
}

function resolveCommand(command: string, args: string[]) {
  if (process.platform !== "win32") {
    return { command, args };
  }

  return { command: "cmd.exe", args: ["/d", "/s", "/c", command, ...args] };
}
