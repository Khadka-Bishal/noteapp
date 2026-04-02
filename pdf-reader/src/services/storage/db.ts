import Dexie, { type EntityTable } from 'dexie';
import type { PDFDocumentMeta, ReadingState } from '../../types/document';
import type { Annotation, RepeatedTermLink } from '../../types/annotation';

/**
 * Dexie database for the PDF Reader app.
 * Stores document metadata, annotations, reading state, and term links.
 */
class PDFReaderDB extends Dexie {
  documents!: EntityTable<PDFDocumentMeta, 'id'>;
  readingStates!: EntityTable<ReadingState, 'documentId'>;
  annotations!: EntityTable<Annotation, 'id'>;
  repeatedTermLinks!: EntityTable<RepeatedTermLink, 'id'>;

  constructor() {
    super('PDFReaderDB');

    this.version(1).stores({
      documents: 'id, title, lastOpenedAt',
      readingStates: 'documentId',
      annotations: 'id, documentId, [documentId+type], repeatedTermLinkId',
      repeatedTermLinks: 'id, documentId, normalizedTerm',
    });
  }
}

export const db = new PDFReaderDB();
