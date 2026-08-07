export const IDIOM_REGISTERS = ["formal", "informal", "neutral"] as const;

export type IdiomRegister = (typeof IDIOM_REGISTERS)[number];

export function isIdiomRegister(value: string): value is IdiomRegister {
  return (IDIOM_REGISTERS as readonly string[]).includes(value);
}
