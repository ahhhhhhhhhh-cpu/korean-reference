import { PILOT_EXPECTED_COUNTS } from "./import-config";

/** Supported promotion target statuses for the Formal Pilot CLI. */
export type PromoteTargetStatus = "in_review" | "published";

export const PROMOTE_TARGET_STATUSES: readonly PromoteTargetStatus[] = [
  "in_review",
  "published",
];

export type PromoteTransition = {
  targetStatus: PromoteTargetStatus;
  sourceStatus: string;
  label: string;
};

export const PROMOTE_TRANSITIONS: Record<PromoteTargetStatus, PromoteTransition> = {
  in_review: {
    targetStatus: "in_review",
    sourceStatus: "draft",
    label: "draft -> in_review",
  },
  published: {
    targetStatus: "published",
    sourceStatus: "in_review",
    label: "in_review -> published",
  },
};

/** Deterministic update order (bottom-up for published guards). */
export const PROMOTE_UPDATE_ORDER = [
  "sense_translations",
  "senses",
  "entries",
  "example_translations",
  "examples",
  "entry_aliases",
] as const;

export type PromoteEntity = (typeof PROMOTE_UPDATE_ORDER)[number];

export const PROMOTE_TABLE_BY_ENTITY: Record<PromoteEntity, string> = {
  sense_translations: "public.sense_translations",
  senses: "public.senses",
  entries: "public.entries",
  example_translations: "public.example_translations",
  examples: "public.examples",
  entry_aliases: "public.entry_aliases",
};

export const PROMOTE_EXPECTED_COUNTS = PILOT_EXPECTED_COUNTS;

export function resolvePromoteTransition(
  targetStatus: PromoteTargetStatus,
): PromoteTransition {
  return PROMOTE_TRANSITIONS[targetStatus];
}

export function parsePromoteTargetStatus(
  value: string | undefined,
): PromoteTargetStatus | null {
  if (value === "in_review" || value === "published") return value;
  return null;
}
