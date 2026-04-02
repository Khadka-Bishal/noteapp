import { useDocumentStore } from '../../stores/documentStore';
import { useUIStore } from '../../stores/uiStore';
import { useAnnotationStore } from '../../stores/annotationStore';
import { OutlinePanel } from './OutlinePanel';
import { exportAsMarkdown } from '../../services/export/exportService';

export function Sidebar() {
  const activeTab = useUIStore((s) => s.sidebarTab);
  const setSidebarTab = useUIStore((s) => s.setSidebarTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'outline': return <OutlinePanel />;
      case 'pages': return <ThumbnailsList />;
      case 'notes': return <SidebarNotesList />;
      default: return <OutlinePanel />;
    }
  };

  return (
    <aside className="sidebar zen-ui" role="complementary" aria-label="Document sidebar">
      <div className="sidebar-header">
        <div className="sidebar-selector-wrapper">
          <select 
            value={activeTab} 
            onChange={(e) => setSidebarTab(e.target.value as any)}
            className="sidebar-dropdown"
          >
            <option value="outline">Table of Contents</option>
            <option value="pages">Pages</option>
            <option value="notes">Notes & Highlights</option>
          </select>
          <div className="sidebar-dropdown-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      <div className="sidebar-content-scrollable">
        {renderContent()}
      </div>
    </aside>
  );
}

function ThumbnailsList() {
  const pageCount = useDocumentStore((s) => s.pageCount);
  const setActivePage = useUIStore((s) => s.setActivePage);

  const handleClick = (page: number) => {
    setActivePage(page);
    const el = document.getElementById(`page-${page}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="sidebar-thumbnails-grid">
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
        <button key={page} className="sidebar-thumbnail-item" onClick={() => handleClick(page)}>
          <div className="thumbnail-box">{page}</div>
        </button>
      ))}
    </div>
  );
}

function SidebarNotesList() {
  const annotations = useAnnotationStore((s) => s.annotations);
  const documentMeta = useDocumentStore((s) => s.document);
  const setActivePage = useUIStore((s) => s.setActivePage);

  const notes = annotations.filter(a => a.type === 'note' || a.type === 'highlight');

  const jumpToNote = (page: number) => {
    setActivePage(page);
    const el = document.getElementById(`page-${page}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="sidebar-notes-container">
      <div className="sidebar-notes-actions">
        <button 
          className="sidebar-export-btn"
          onClick={() => documentMeta && exportAsMarkdown(documentMeta, notes)}
        >
          Export Markdown
        </button>
      </div>
      {notes.length === 0 ? (
        <div className="empty-state">
          <p>No notes yet.</p>
          <span>Highlight text or add notes to see them here.</span>
        </div>
      ) : (
        <div className="sidebar-notes-list">
          {notes.map(note => (
            <div key={note.id} className="sidebar-note-card" onClick={() => jumpToNote(note.anchor.pageNumber)}>
              <div className="note-card-header">
                <span className="note-page">Page {note.anchor.pageNumber}</span>
              </div>
              <p className="note-quote">"{note.anchor.exactText || 'Drawing'}"</p>
              {note.noteText && <p className="note-comment">{note.noteText}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
