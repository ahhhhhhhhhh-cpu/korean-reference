import type { ConjugationFormKey } from "@/lib/constants/conjugation-forms";
import { CONJUGATION_FORM_KEYS } from "@/lib/constants/conjugation-forms";

export const CONJUGATION_FORM_I18N_KEYS = {
  present_polite: "formPresentPolite",
  past_polite: "formPastPolite",
  present_formal: "formPresentFormal",
  past_formal: "formPastFormal",
  present_informal: "formPresentInformal",
  propositive: "formPropositive",
} as const satisfies Record<ConjugationFormKey, string>;

export function getConjugationFormLabels(
  translate: (key: string) => string
): Record<ConjugationFormKey, string> {
  return Object.fromEntries(
    CONJUGATION_FORM_KEYS.map((form) => [
      form,
      translate(CONJUGATION_FORM_I18N_KEYS[form]),
    ])
  ) as Record<ConjugationFormKey, string>;
}
