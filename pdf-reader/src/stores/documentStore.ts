import { create } from 'zustand';
import type { PDFDocumentMeta, OutlineItem } from '../types/document';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { loadPDFFromBuffer } from '../services/pdf/pdfLoader';
import { getDocument, loadPDFBlob, deleteDocument as deleteDocStorage, updateLastOpened } from '../services/storage/documentStorage';
import { useAnnotationStore } from './annotationStore';
import { getAnnotationsForDocument, getRepeatedTermLinksForDocument } from '../services/storage/annotationStorage';

interface DocumentState {
  // Current document
  document: PDFDocumentMeta | null;
  pdfDoc: PDFDocumentProxy | null;
  outline: OutlineItem[];
  pageCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  setDocument: (doc: PDFDocumentMeta, pdfDoc: PDFDocumentProxy) => void;
  setOutline: (outline: OutlineItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  closeDocument: () => void;
  
  loadDocumentFromStorage: (id: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  document: null,
  pdfDoc: null,
  outline: [],
  pageCount: 0,
  isLoading: false,
  error: null,

  setDocument: (doc, pdfDoc) =>
    set({
      document: doc,
      pdfDoc,
      pageCount: pdfDoc.numPages,
      isLoading: false,
      error: null,
    }),

  setOutline: (outline) => set({ outline }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  closeDocument: () =>
    set({
      document: null,
      pdfDoc: null,
      outline: [],
      pageCount: 0,
      error: null,
    }),

  loadDocumentFromStorage: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const docMeta = await getDocument(id);
      if (!docMeta) throw new Error('Document metadata not found');

      const buffer = await loadPDFBlob(id);
      if (!buffer) throw new Error('PDF file data not found in OPFS/IDB');

      await updateLastOpened(id);

      const existingAnnos = await getAnnotationsForDocument(id);
      const existingLinks = await getRepeatedTermLinksForDocument(id);
      useAnnotationStore.getState().setAnnotations(existingAnnos);
      useAnnotationStore.getState().setRepeatedTermLinks(existingLinks);

      const pdfDoc = await loadPDFFromBuffer(buffer);
      set({
        document: docMeta,
        pdfDoc,
        pageCount: pdfDoc.numPages,
        isLoading: false,
        error: null,
      });
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Unknown error loading PDF';
      set({ error, isLoading: false });
    }
  },

  deleteDocument: async (id: string) => {
    await deleteDocStorage(id);
    // If the deleted document is the currently open one, close it
    set((state) => {
      if (state.document?.id === id) {
        return {
          document: null,
          pdfDoc: null,
          outline: [],
          pageCount: 0,
          error: null,
        };
      }
      return state;
    });
  }
}));
