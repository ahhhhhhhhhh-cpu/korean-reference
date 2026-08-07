import type { DifficultyTier } from "@/lib/constants/difficulty-tier";

export { DIFFICULTY_TIERS } from "@/lib/constants/difficulty-tier";
export type { DifficultyTier } from "@/lib/constants/difficulty-tier";

export function matchesDifficultyTier(
  difficulty: number | null | undefined,
  tier: DifficultyTier
): boolean {
  if (difficulty == null) return false;
  switch (tier) {
    case "beginner":
      return difficulty <= 2;
    case "intermediate":
      return difficulty === 3;
    case "advanced":
      return difficulty >= 4;
    default:
      return false;
  }
}

export function difficultyTierForValue(
  difficulty: number | null | undefined
): DifficultyTier | null {
  if (difficulty == null) return null;
  if (difficulty <= 2) return "beginner";
  if (difficulty === 3) return "intermediate";
  return "advanced";
}
