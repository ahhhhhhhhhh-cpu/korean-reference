export const IRREGULAR_TYPES = ["ㄷ", "ㅂ", "ㅅ", "ㅎ", "르", "러", "여", "우"] as const;

export type IrregularType = (typeof IRREGULAR_TYPES)[number];

export function isIrregularType(value: string): value is IrregularType {
  return (IRREGULAR_TYPES as readonly string[]).includes(value);
}
