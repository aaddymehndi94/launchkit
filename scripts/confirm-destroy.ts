import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

type Stage = "dev" | "prod";

const stage = process.argv[2] as Stage | undefined;
if (stage !== "dev" && stage !== "prod") {
  throw new Error("Usage: tsx scripts/confirm-destroy.ts dev|prod");
}

if (stage === "prod" && process.env.ALLOW_PROD_DESTROY !== "true") {
  throw new Error("Prod destroy is disabled. Set ALLOW_PROD_DESTROY=true only when you deliberately want to destroy prod.");
}

const stackName = `LaunchKit-${stage}`;
const phrase = `DESTROY ${stage.toUpperCase()}`;
const identity = await readAwsIdentity();

console.log(`AWS profile: ${process.env.AWS_PROFILE ?? "default"}`);
console.log(`AWS region: ${process.env.AWS_REGION ?? process.env.CDK_DEFAULT_REGION ?? "from CDK/AWS config"}`);
console.log(`AWS account: ${identity.Account}`);
console.log(`AWS arn: ${identity.Arn}`);
console.log(`CDK stack: ${stackName}`);
console.log("");

const rl = createInterface({ input, output });
const answer = await rl.question(`This will run cdk destroy for ${stackName}. Type ${phrase} to continue: `);
rl.close();

if (answer !== phrase) {
  console.log("Destroy cancelled.");
  process.exit(1);
}

await run("pnpm", ["--filter", "@launchkit/infra", "exec", "cdk", "destroy", stackName, "--force"], {
  ...process.env,
  STAGE: stage
});

type AwsIdentity = {
  Account: string;
  Arn: string;
};

async function readAwsIdentity(): Promise<AwsIdentity> {
  const output = await collect("aws", ["sts", "get-caller-identity", "--output", "json"]);
  const parsed = JSON.parse(output) as Partial<AwsIdentity>;
  if (!parsed.Account || !parsed.Arn) {
    throw new Error("Could not read AWS account identity.");
  }

  return {
    Account: parsed.Account,
    Arn: parsed.Arn
  };
}

function collect(command: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    const spawnInput = resolveCommand(command, args);
    const child = spawn(spawnInput.command, spawnInput.args, {
      shell: false,
      stdio: ["ignore", "pipe", "inherit"]
    });
    let stdout = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code ?? 1}.`));
    });
  });
}

function run(command: string, args: string[], env: NodeJS.ProcessEnv) {
  return new Promise<void>((resolve, reject) => {
    const spawnInput = resolveCommand(command, args);
    const child = spawn(spawnInput.command, spawnInput.args, {
      env,
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
