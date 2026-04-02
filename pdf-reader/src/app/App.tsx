import { useCallback, useState } from 'react';
import { useDocumentStore } from '../stores/documentStore';
import { useAnnotationStore } from '../stores/annotationStore';
import { loadPDFFromBuffer } from '../services/pdf/pdfLoader';
import { extractOutline } from '../services/pdf/outlineExtractor';
import { sha256 } from '../utils/hash';
import { storePDFBlob, saveDocument } from '../services/storage/documentStorage';
import { getAnnotationsForDocument, getRepeatedTermLinksForDocument } from '../services/storage/annotationStorage';
import { PDFViewer } from '../components/viewer/PDFViewer';
import { DropZone } from '../components/common/DropZone';
import { Library } from '../components/library/Library';
import type { PDFDocumentMeta } from '../types/document';

export default function App() {
  const document = useDocumentStore((s) => s.document);
  const setDocument = useDocumentStore((s) => s.setDocument);
  const setOutline = useDocumentStore((s) => s.setOutline);
  const setLoading = useDocumentStore((s) => s.setLoading);
  const setError = useDocumentStore((s) => s.setError);
  const error = useDocumentStore((s) => s.error);
  const isLoading = useDocumentStore((s) => s.isLoading);

  const setAnnotations = useAnnotationStore((s) => s.setAnnotations);
  const setRepeatedTermLinks = useAnnotationStore((s) => s.setRepeatedTermLinks);

  const [isDragging, setDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setLoading(true);
      try {
        const buffer = await file.arrayBuffer();
        const hash = await sha256(buffer);

        const pdfDoc = await loadPDFFromBuffer(buffer);
        const metadata = await pdfDoc.getMetadata();
        const info = metadata.info as Record<string, unknown>;

        const doc: PDFDocumentMeta = {
          id: hash,
          title: (info?.Title as string) || file.name.replace(/\.pdf$/i, ''),
          fileName: file.name,
          fileSize: file.size,
          pageCount: pdfDoc.numPages,
          createdAt: new Date().toISOString(),
          lastOpenedAt: new Date().toISOString(),
          outline: [],
          opfsPath: `/pdfs/${hash}.pdf`,
        };

        // Persist to storage
        await storePDFBlob(hash, buffer);
        await saveDocument(doc);
        
        // Load existing annotations if any
        const existingAnnos = await getAnnotationsForDocument(hash);
        const existingLinks = await getRepeatedTermLinksForDocument(hash);
        setAnnotations(existingAnnos);
        setRepeatedTermLinks(existingLinks);

        setDocument(doc, pdfDoc);

        // Extract outline asynchronously
        const outline = await extractOutline(pdfDoc);
        setOutline(outline);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error loading PDF';
        setError(message);
      }
    },
    [setDocument, setOutline, setLoading, setError, setAnnotations, setRepeatedTermLinks]
  );

  const handleUrlImport = useCallback(
    async (url: string) => {
      if (!url) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to fetch PDF (Status: ${res.status}).`);
        }
        const buffer = await res.arrayBuffer();
        let fileName = url.split('/').pop() || 'document.pdf';
        if (!fileName.toLowerCase().endsWith('.pdf')) {
          fileName += '.pdf';
        }
        const file = new File([buffer], fileName, { type: 'application/pdf' });
        await handleFile(file);
      } catch (err) {
        setLoading(false);
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
          setError('Could not import from URL due to CORS restrictions. Please download the file manually and drag it here.');
        } else {
          setError(err instanceof Error ? err.message : 'Unknown error importing from URL');
        }
      }
    },
    [handleFile, setLoading, setError]
  );

  // If a document is loaded, show the viewer
  if (document) {
    return (
      <div className="app">
        <PDFViewer />
      </div>
    );
  }

  // Otherwise show the landing / drop zone
  return (
    <div className="app">
      <div className="landing">
        <header className="landing-header">
          <h1 className="landing-logo">
            <span className="landing-logo-accent">📄</span> PDF Reader
          </h1>
          <p className="landing-tagline">
            Read, highlight, and annotate — right in your browser
          </p>
        </header>

        {error && (
          <div className="landing-error">
            <p><strong>Error:</strong> {error}</p>
            <button onClick={() => setError(null)} className="landing-error-close">Dismiss</button>
          </div>
        )}

        {isLoading && (
          <div className="landing-loading">
            <div className="spinner"></div>
            <p>Processing PDF...</p>
          </div>
        )}

        <DropZone
          onFileDrop={handleFile}
          onFileSelect={handleFile}
          onUrlImport={handleUrlImport}
          isDragging={isDragging}
          setDragging={setDragging}
        />

        <Library />

        <footer className="landing-footer">
          <p>
            Your files stay on your device. Nothing is uploaded to any server.
          </p>
        </footer>
      </div>
    </div>
  );
}
