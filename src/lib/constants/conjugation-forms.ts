export const CONJUGATION_FORM_KEYS = [
  "present_polite",
  "past_polite",
  "present_formal",
  "past_formal",
  "present_informal",
  "propositive",
] as const;

export type ConjugationFormKey = (typeof CONJUGATION_FORM_KEYS)[number];

export function isConjugationFormKey(value: string): value is ConjugationFormKey {
  return (CONJUGATION_FORM_KEYS as readonly string[]).includes(value);
}
