import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = createInterface({ input, output });
const answer = await rl.question(
  "This will run database migrations against the prod stage. Type MIGRATE PROD to continue: "
);
rl.close();

if (answer !== "MIGRATE PROD") {
  console.log("Prod migration cancelled.");
  process.exit(1);
}

const command = process.platform === "win32" ? "cmd.exe" : "pnpm";
const args =
  process.platform === "win32"
    ? ["/d", "/s", "/c", "pnpm", "--filter", "@launchkit/db", "db:migrate:prod"]
    : ["--filter", "@launchkit/db", "db:migrate:prod"];

const child = spawn(command, args, {
  stdio: "inherit",
  shell: false
});

child.on("exit", (code) => process.exit(code ?? 1));
