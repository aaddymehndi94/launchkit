import { describe, expect, it } from "vitest";
import type { AppliedMigration, LocalMigration } from "../src/migration-state.js";
import { compareMigrationState } from "../src/migration-state.js";

const local = [
  { tag: "0000_initial", when: 1000, hash: "aaa" },
  { tag: "0001_profile_photo", when: 2000, hash: "bbb" }
] satisfies LocalMigration[];

describe("migration state comparison", () => {
  it("reports pending migrations when nothing is applied", () => {
    expect(compareMigrationState(local, [])).toMatchObject({
      status: "pending",
      appliedCount: 0,
      pending: local
    });
  });

  it("reports current when applied migrations exactly match", () => {
    expect(compareMigrationState(local, applied(local))).toMatchObject({
      status: "current",
      appliedCount: 2,
      pending: []
    });
  });

  it("reports pending suffix migrations", () => {
    expect(compareMigrationState(local, applied(local.slice(0, 1)))).toMatchObject({
      status: "pending",
      appliedCount: 1,
      pending: [local[1]]
    });
  });

  it("reports ahead when the database has extra migrations", () => {
    expect(
      compareMigrationState(local, [
        ...applied(local),
        { id: 3, createdAt: 3000, hash: "ccc" }
      ])
    ).toMatchObject({
      status: "ahead"
    });
  });

  it("reports divergence when a hash or timestamp does not match", () => {
    expect(
      compareMigrationState(local, [
        { id: 1, createdAt: 1000, hash: "aaa" },
        { id: 2, createdAt: 2000, hash: "changed" }
      ])
    ).toMatchObject({
      status: "diverged"
    });
  });
});

function applied(migrations: LocalMigration[]): AppliedMigration[] {
  return migrations.map((migration, index) => ({
    id: index + 1,
    hash: migration.hash,
    createdAt: migration.when
  }));
}
