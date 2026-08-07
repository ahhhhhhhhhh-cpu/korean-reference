export const FREQUENCY_LEVELS = ["high", "medium", "low"] as const;

export type FrequencyLevel = (typeof FREQUENCY_LEVELS)[number];

export function isFrequencyLevel(value: string): value is FrequencyLevel {
  return (FREQUENCY_LEVELS as readonly string[]).includes(value);
}
