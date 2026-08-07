export const PUBLICATION_STATUSES = [
  "draft",
  "in_review",
  "published",
  "archived",
] as const;

export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export function isPublicationStatus(value: string): value is PublicationStatus {
  return (PUBLICATION_STATUSES as readonly string[]).includes(value);
}

export function isPublishedStatus(status: PublicationStatus): boolean {
  return status === "published";
}
