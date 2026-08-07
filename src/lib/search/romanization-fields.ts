import type { RomanizationFields } from "@/lib/types/common";
import type { SearchField } from "@/lib/search/matcher";

/** Build search fields from audited romanization values only. */
export function romanizationFields({
  romanization,
  romanizationAliases = [],
}: RomanizationFields): SearchField[] {
  const fields: SearchField[] = [];

  if (romanization) {
    fields.push({ kind: "romanization", value: romanization });
  }

  for (const alias of romanizationAliases) {
    fields.push({ kind: "romanization_alias", value: alias });
  }

  return fields;
}
