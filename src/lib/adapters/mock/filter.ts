import type { PublicationStatus } from "@/lib/constants/publication-status";
import { isPublishedStatus } from "@/lib/constants/publication-status";

export function filterPublished<T extends { status: PublicationStatus }>(
  items: T[]
): T[] {
  return items.filter((item) => isPublishedStatus(item.status));
}

export function findPublishedBySlug<T extends { slug: string; status: PublicationStatus }>(
  items: T[],
  slug: string
): T | null {
  const item = items.find((candidate) => candidate.slug === slug);
  if (!item || !isPublishedStatus(item.status)) return null;
  return item;
}
