import { db } from './db';
import type { Annotation, RepeatedTermLink } from '../../types/annotation';

// --- Annotations ---

export async function saveAnnotation(annotation: Annotation): Promise<void> {
  await db.annotations.put(annotation);
}

export async function getAnnotationsForDocument(
  documentId: string
): Promise<Annotation[]> {
  return db.annotations.where('documentId').equals(documentId).toArray();
}

export async function updateAnnotation(
  id: string,
  updates: Partial<Annotation>
): Promise<void> {
  await db.annotations.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteAnnotation(id: string): Promise<void> {
  await db.annotations.delete(id);
}

export async function deleteAnnotationsByTermLink(
  linkId: string
): Promise<void> {
  await db.annotations.where('repeatedTermLinkId').equals(linkId).delete();
}

// --- Repeated Term Links ---

export async function saveRepeatedTermLink(
  link: RepeatedTermLink
): Promise<void> {
  await db.repeatedTermLinks.put(link);
}

export async function getRepeatedTermLinksForDocument(
  documentId: string
): Promise<RepeatedTermLink[]> {
  return db.repeatedTermLinks
    .where('documentId')
    .equals(documentId)
    .toArray();
}

export async function deleteRepeatedTermLink(id: string): Promise<void> {
  await db.repeatedTermLinks.delete(id);
  // Also delete all annotations associated with this link
  await deleteAnnotationsByTermLink(id);
}
