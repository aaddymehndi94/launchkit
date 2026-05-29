import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("database deployment guard scripts", () => {
  it("runs migration ensure checks before dev and prod deploys", () => {
    const rootPackage = JSON.parse(readFileSync(resolve(process.cwd(), "..", "..", "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    const dbPackage = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(rootPackage.scripts["deploy:dev"]).toContain("deploy-stage.ts dev");
    expect(rootPackage.scripts["deploy:prod"]).toContain("deploy-stage.ts prod");
    expect(rootPackage.scripts["db:ensure:local"]).toContain("ensure-local-db.ts");
    expect(rootPackage.scripts["release:prod"]).toBe("pnpm deploy:prod && pnpm smoke:prod");
    expect(dbPackage.scripts["db:ensure:dev"]).toContain("ensure-migrations.ts dev");
    expect(dbPackage.scripts["db:ensure:prod"]).toContain("ensure-migrations.ts prod");
  });

  it("prepares the local database before starting dev servers", () => {
    const devScript = readFileSync(resolve(process.cwd(), "..", "..", "scripts", "dev.ts"), "utf8");
    const ensureLocalScript = readFileSync(resolve(process.cwd(), "..", "..", "scripts", "ensure-local-db.ts"), "utf8");

    expect(devScript).toContain("db:ensure:local");
    expect(devScript).toContain("db:seed:local");
    expect(devScript.indexOf("db:ensure:local")).toBeLessThan(devScript.indexOf("const { result } = concurrently"));
    expect(ensureLocalScript).toContain("waitForPostgres");
    expect(ensureLocalScript).toContain("pg_isready");
  });

  it("uses one prod deploy confirmation for migrations and CDK deploy", () => {
    const deployScript = readFileSync(resolve(process.cwd(), "..", "..", "scripts", "deploy-stage.ts"), "utf8");

    expect(deployScript).toContain("DEPLOY PROD");
    expect(deployScript).toContain("LAUNCHKIT_PROD_CONFIRMED");
  });
});
