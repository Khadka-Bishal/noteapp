import { useEffect, useState } from 'react';
import { useDocumentStore } from '../../stores/documentStore';
import { getAllDocuments } from '../../services/storage/documentStorage';
import type { PDFDocumentMeta } from '../../types/document';

export function Library() {
  const [documents, setDocuments] = useState<PDFDocumentMeta[]>([]);
  const loadDocumentFromStorage = useDocumentStore((s) => s.loadDocumentFromStorage);
  const deleteDocument = useDocumentStore((s) => s.deleteDocument);

  const fetchDocs = async () => {
    const docs = await getAllDocuments();
    setDocuments(docs);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="library">
      <h2 className="library-title">Recent Documents</h2>
      <div className="library-grid">
        {documents.map((doc) => (
          <div key={doc.id} className="library-card" onClick={() => loadDocumentFromStorage(doc.id)}>
            <div className="library-card-thumbnail">
              📄
            </div>
            <div className="library-card-info">
              <h3 className="library-card-title">{doc.title}</h3>
              <p className="library-card-meta">
                {doc.pageCount} pages • {new Date(doc.lastOpenedAt).toLocaleDateString()}
              </p>
            </div>
            <button
              className="library-card-delete"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this document and all its notes?')) {
                  deleteDocument(doc.id).then(fetchDocs);
                }
              }}
              title="Delete Document"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
