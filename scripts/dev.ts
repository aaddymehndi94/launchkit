import concurrently from "concurrently";

const apiPort = process.env.API_PORT ?? "4000";
const webPort = process.env.WEB_PORT ?? "5173";

const { result } = concurrently(
  [
    {
      name: "api",
      command: `pnpm --filter @launchkit/api dev -- --port ${apiPort}`,
      prefixColor: "cyan"
    },
    {
      name: "web",
      command: `pnpm --filter @launchkit/web dev -- --host 0.0.0.0 --port ${webPort}`,
      prefixColor: "magenta"
    }
  ],
  {
    killOthers: ["failure", "success"],
    restartTries: 0
  }
);

await result;
