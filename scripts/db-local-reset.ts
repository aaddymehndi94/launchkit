import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const phrase = "RESET LOCAL DB";
const rl = createInterface({ input, output });
const answer = await rl.question(
  `This deletes only the local Docker Postgres volume from docker-compose.local.yml. Type ${phrase} to continue: `
);
rl.close();

if (answer !== phrase) {
  console.log("Local database reset cancelled.");
  process.exit(1);
}

await run("docker", ["compose", "-f", "docker-compose.local.yml", "down", "-v"]);
await run("pnpm", ["db:ensure:local"]);
await run("pnpm", ["db:seed:local"]);

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const spawnInput = resolveCommand(command, args);
    const child = spawn(spawnInput.command, spawnInput.args, {
      stdio: "inherit",
      shell: false
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code ?? 1}.`));
    });
  });
}

function resolveCommand(command: string, args: string[]) {
  if (process.platform !== "win32") {
    return { command, args };
  }

  return { command: "cmd.exe", args: ["/d", "/s", "/c", command, ...args] };
}
