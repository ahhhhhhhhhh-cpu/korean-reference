export const DIFFICULTY_TIERS = [
  "beginner",
  "intermediate",
  "advanced",
] as const;

export type DifficultyTier = (typeof DIFFICULTY_TIERS)[number];

export function isDifficultyTier(value: string): value is DifficultyTier {
  return (DIFFICULTY_TIERS as readonly string[]).includes(value);
}
