export const SOUND_CHANGE_CATEGORIES = [
  "liaison",
  "nasalization",
  "liquidization",
  "tensification",
  "aspiration",
  "h_changes",
  "batchim",
  "other",
] as const;

export type SoundChangeCategory = (typeof SOUND_CHANGE_CATEGORIES)[number];

export function isSoundChangeCategory(
  value: string
): value is SoundChangeCategory {
  return (SOUND_CHANGE_CATEGORIES as readonly string[]).includes(value);
}
