export const ETYMOLOGY_TYPES = [
  "native",
  "sino_korean",
  "loanword",
  "hybrid",
  "unknown",
] as const;

export type EtymologyType = (typeof ETYMOLOGY_TYPES)[number];

export function isEtymologyType(value: string): value is EtymologyType {
  return (ETYMOLOGY_TYPES as readonly string[]).includes(value);
}
