import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

type Stage = "dev" | "prod";

const stage = process.argv[2] as Stage | undefined;
if (stage !== "dev" && stage !== "prod") {
  throw new Error("Usage: tsx scripts/deploy-stage.ts dev|prod");
}

if (stage === "prod") {
  await confirmProdDeploy();
}

await run("pnpm", ["verify"]);

const ensureResult = await run("pnpm", [`db:ensure:${stage}`], {
  allowFailure: true,
  env: stage === "prod" ? { ...process.env, LAUNCHKIT_PROD_CONFIRMED: "true" } : process.env
});
if (ensureResult === 2) {
  console.log("");
  console.log(`Running ${stage} infrastructure deploy so stage resources and /launchkit/${stage}/app are present.`);
  await run("pnpm", ["--filter", "@launchkit/infra", `deploy:${stage}`]);
  console.log("");
  console.log(`Initial ${stage} infrastructure deploy finished, but database setup is not complete.`);
  console.log(`Update /launchkit/${stage}/app in AWS Secrets Manager with your Neon DATABASE_URL, then run pnpm deploy:${stage} again.`);
  process.exit(1);
}

if (ensureResult !== 0) {
  process.exit(ensureResult);
}

await run("pnpm", ["--filter", "@launchkit/infra", `deploy:${stage}`]);

async function confirmProdDeploy() {
  const rl = createInterface({ input, output });
  const answer = await rl.question("This will verify, migrate if needed, and deploy prod. Type DEPLOY PROD to continue: ");
  rl.close();

  if (answer !== "DEPLOY PROD") {
    console.log("Prod deploy cancelled.");
    process.exit(1);
  }
}

function run(
  command: string,
  args: string[],
  options: { allowFailure?: boolean; env?: NodeJS.ProcessEnv } = {}
) {
  return new Promise<number>((resolve, reject) => {
    const spawnInput = resolveCommand(command, args);
    const child = spawn(spawnInput.command, spawnInput.args, {
      env: options.env,
      stdio: "inherit",
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
