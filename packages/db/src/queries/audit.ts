import type { DbClient } from "../client.js";
import { auditLogs } from "../schema.js";

export type WriteAuditInput = {
  actorProfileId?: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
};

export async function writeAudit(db: DbClient, input: WriteAuditInput): Promise<void> {
  await db.insert(auditLogs).values({
    actorProfileId: input.actorProfileId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    metadata: input.metadata ?? {}
  });
}
