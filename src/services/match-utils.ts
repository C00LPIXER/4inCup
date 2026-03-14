import type { BowlerScore } from "@/types";

export type ValidateResult = { ok: true } | { ok: false; reason: string };

/**
 * Validate whether the given bowler can bowl the next over under these rules:
 * - Match cannot exceed total overs
 * - No bowler may bowl more than 2 overs
 * - At most `maxTwoOversBowlers` bowlers may reach 2 overs (use 1 for the rule)
 */
export function canBowlNextOver(
  bowlerId: string,
  bowlers: BowlerScore[] | undefined,
  matchOversTotal: number,
  oversBowledSoFar: number,
  maxTwoOversBowlers = 1
): ValidateResult {
  if (oversBowledSoFar >= matchOversTotal) return { ok: false, reason: "All overs already bowled" };

  const rec = (bowlers || []).find((b) => b.playerId === bowlerId);
  const current = rec ? rec.overs : 0;
  if (current >= 2) return { ok: false, reason: "This bowler already bowled 2 overs" };

  const twosCount = (bowlers || []).filter((b) => (b.overs ?? 0) >= 2).length;
  const willReachTwo = current + 1 >= 2;
  if (willReachTwo && twosCount >= maxTwoOversBowlers) {
    return { ok: false, reason: `Only ${maxTwoOversBowlers} bowler(s) may bowl 2 overs` };
  }

  return { ok: true };
}
