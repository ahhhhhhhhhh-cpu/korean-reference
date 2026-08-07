export const IRREGULAR_TYPES = ["ㄷ", "ㅂ", "르", "ㅎ", "ㅅ", "ㅡ", "ㄹ"] as const;

export type IrregularType = (typeof IRREGULAR_TYPES)[number];

export function isIrregularType(value: string): value is IrregularType {
  return (IRREGULAR_TYPES as readonly string[]).includes(value);
}
