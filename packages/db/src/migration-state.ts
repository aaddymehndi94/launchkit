import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

export type LocalMigration = {
  tag: string;
  when: number;
  hash: string;
};

export type AppliedMigration = {
  id: number;
  hash: string;
  createdAt: number;
};

export type MigrationComparison =
  | {
      status: "current";
      appliedCount: number;
      pending: LocalMigration[];
    }
  | {
      status: "pending";
      appliedCount: number;
      pending: LocalMigration[];
    }
  | {
      status: "ahead";
      appliedCount: number;
      pending: LocalMigration[];
      message: string;
    }
  | {
      status: "diverged";
      appliedCount: number;
      pending: LocalMigration[];
      message: string;
    };

type Journal = {
  entries: Array<{
    tag: string;
    when: number;
  }>;
};

export async function readLocalMigrations(migrationsFolder: string): Promise<LocalMigration[]> {
  const journalPath = path.resolve(migrationsFolder, "meta", "_journal.json");
  const journal = JSON.parse(await readFile(journalPath, "utf8")) as Journal;
  const files = new Set((await readdir(migrationsFolder)).filter((file) => file.endsWith(".sql")));

  return Promise.all(
    journal.entries.map(async (entry) => {
      const filename = `${entry.tag}.sql`;
      if (!files.has(filename)) {
        throw new Error(`Migration journal references missing file: ${filename}`);
      }

      const sql = await readFile(path.resolve(migrationsFolder, filename), "utf8");
      return {
        tag: entry.tag,
        when: entry.when,
        hash: createHash("sha256").update(sql).digest("hex")
      };
    })
  );
}

export function compareMigrationState(
  localMigrations: LocalMigration[],
  appliedMigrations: AppliedMigration[]
): MigrationComparison {
  const appliedCount = appliedMigrations.length;
  const pending = localMigrations.slice(appliedCount);

  if (appliedCount > localMigrations.length) {
    return {
      status: "ahead",
      appliedCount,
      pending: [],
      message: `Database has ${appliedCount} migrations, but this repo has ${localMigrations.length}.`
    };
  }

  for (let index = 0; index < appliedCount; index += 1) {
    const local = localMigrations[index]!;
    const applied = appliedMigrations[index]!;

    if (applied.createdAt !== local.when || applied.hash !== local.hash) {
      return {
        status: "diverged",
        appliedCount,
        pending,
        message: `Migration #${index + 1} does not match repo migration ${local.tag}.`
      };
    }
  }

  if (pending.length > 0) {
    return {
      status: "pending",
      appliedCount,
      pending
    };
  }

  return {
    status: "current",
    appliedCount,
    pending: []
  };
}
