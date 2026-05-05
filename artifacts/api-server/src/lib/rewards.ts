import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { db, pointsLedgerTable, rewardRulesTable } from "@workspace/db";

const DEFAULT_POINTS_PER_KG = 10;

function normalizeWasteType(value: string): string {
  return value.trim().toLowerCase();
}

export async function resolvePointsPerKg(wasteType: string, city?: string | null): Promise<number> {
  const normalizedWasteType = normalizeWasteType(wasteType);
  const normalizedCity = city?.trim() || null;

  if (normalizedCity) {
    const cityRuleRows = await db
      .select({ pointsPerKg: rewardRulesTable.pointsPerKg })
      .from(rewardRulesTable)
      .where(
        and(
          eq(rewardRulesTable.wasteType, normalizedWasteType),
          eq(rewardRulesTable.city, normalizedCity),
          eq(rewardRulesTable.isActive, true),
        ),
      )
      .limit(1);
    const cityRule = cityRuleRows[0];
    if (cityRule) return cityRule.pointsPerKg;
  }

  const globalRuleRows = await db
    .select({ pointsPerKg: rewardRulesTable.pointsPerKg })
    .from(rewardRulesTable)
    .where(
      and(
        eq(rewardRulesTable.wasteType, normalizedWasteType),
        isNull(rewardRulesTable.city),
        eq(rewardRulesTable.isActive, true),
      ),
    )
    .orderBy(desc(rewardRulesTable.updatedAt))
    .limit(1);

  const globalRule = globalRuleRows[0];
  return globalRule?.pointsPerKg ?? DEFAULT_POINTS_PER_KG;
}

export async function calculatePickupPoints(input: {
  wasteType: string;
  finalWeightKg: number;
  city?: string | null;
}): Promise<{ pointsPerKg: number; pointsAwarded: number }> {
  const pointsPerKg = await resolvePointsPerKg(input.wasteType, input.city ?? null);
  const pointsAwarded = Math.max(0, Math.round(input.finalWeightKg * pointsPerKg));
  return { pointsPerKg, pointsAwarded };
}

export async function getPointsBalance(userId: number): Promise<number> {
  const rows = await db
    .select({
      total: sql<number>`COALESCE(SUM(${pointsLedgerTable.points}), 0)`,
    })
    .from(pointsLedgerTable)
    .where(eq(pointsLedgerTable.userId, userId));

  return rows[0]?.total ?? 0;
}
