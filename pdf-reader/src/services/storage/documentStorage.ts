import { db } from './db';
import type { PDFDocumentMeta } from '../../types/document';

/**
 * Store a PDF blob in OPFS. Falls back to IndexedDB blob storage on Safari.
 */
export async function storePDFBlob(
  documentId: string,
  buffer: ArrayBuffer
): Promise<string> {
  const path = `/pdfs/${documentId}.pdf`;

  try {
    const root = await navigator.storage.getDirectory();
    const pdfsDir = await root.getDirectoryHandle('pdfs', { create: true });
    const fileHandle = await pdfsDir.getFileHandle(`${documentId}.pdf`, {
      create: true,
    });

    // Try sync access handle (fastest, but not on Safari main thread)
    try {
      const accessHandle = await (fileHandle as any).createSyncAccessHandle();
      accessHandle.write(new Uint8Array(buffer));
      accessHandle.flush();
      accessHandle.close();
    } catch {
      // Fallback: writable stream (works on Safari)
      const writable = await fileHandle.createWritable();
      await writable.write(buffer);
      await writable.close();
    }

    return path;
  } catch {
    // OPFS not available — fall back to IndexedDB blob
    console.warn('OPFS not available, falling back to IndexedDB for PDF storage');
    await db.table('pdfBlobs').put({ id: documentId, blob: new Blob([buffer]) });
    return `idb://${documentId}`;
  }
}

/**
 * Load a PDF blob from OPFS or IndexedDB fallback.
 */
export async function loadPDFBlob(
  documentId: string
): Promise<ArrayBuffer | null> {
  try {
    const root = await navigator.storage.getDirectory();
    const pdfsDir = await root.getDirectoryHandle('pdfs');
    const fileHandle = await pdfsDir.getFileHandle(`${documentId}.pdf`);
    const file = await fileHandle.getFile();
    return await file.arrayBuffer();
  } catch {
    // Try IndexedDB fallback
    try {
      const record = await db.table('pdfBlobs').get(documentId);
      if (record?.blob) {
        return await record.blob.arrayBuffer();
      }
    } catch {
      // Neither available
    }
    return null;
  }
}

/**
 * Delete a PDF blob from OPFS or IndexedDB.
 */
export async function deletePDFBlob(documentId: string): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory();
    const pdfsDir = await root.getDirectoryHandle('pdfs');
    await pdfsDir.removeEntry(`${documentId}.pdf`);
  } catch {
    try {
      await db.table('pdfBlobs').delete(documentId);
    } catch {
      // Ignore
    }
  }
}

// --- Document metadata CRUD ---

export async function saveDocument(doc: PDFDocumentMeta): Promise<void> {
  await db.documents.put(doc);
}

export async function getDocument(
  id: string
): Promise<PDFDocumentMeta | undefined> {
  return db.documents.get(id);
}

export async function getAllDocuments(): Promise<PDFDocumentMeta[]> {
  return db.documents.orderBy('lastOpenedAt').reverse().toArray();
}

export async function deleteDocument(id: string): Promise<void> {
  await db.documents.delete(id);
  await db.annotations.where('documentId').equals(id).delete();
  await db.repeatedTermLinks.where('documentId').equals(id).delete();
  await db.readingStates.delete(id);
  await deletePDFBlob(id);
}

export async function updateLastOpened(id: string): Promise<void> {
  await db.documents.update(id, {
    lastOpenedAt: new Date().toISOString(),
  });
}
