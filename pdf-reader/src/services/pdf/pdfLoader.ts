import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

// Configure the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * Load a PDF document from an ArrayBuffer.
 */
export async function loadPDFFromBuffer(
  buffer: ArrayBuffer
): Promise<PDFDocumentProxy> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/cmaps/',
    cMapPacked: true,
  });
  return loadingTask.promise;
}

/**
 * Load a PDF document from a URL.
 */
export async function loadPDFFromURL(
  url: string
): Promise<PDFDocumentProxy> {
  const loadingTask = pdfjsLib.getDocument({
    url,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/cmaps/',
    cMapPacked: true,
  });
  return loadingTask.promise;
}

/**
 * Extract document metadata.
 */
export async function extractMetadata(pdfDoc: PDFDocumentProxy) {
  const metadata = await pdfDoc.getMetadata();
  const info = metadata.info as Record<string, unknown>;
  return {
    title: (info?.Title as string) || '',
    author: (info?.Author as string) || '',
    subject: (info?.Subject as string) || '',
  };
}
