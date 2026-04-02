import { useDocumentStore } from '../../stores/documentStore';
import { useUIStore } from '../../stores/uiStore';
import { ViewerToolbar } from './ViewerToolbar';
import { ScrollContainer } from './ScrollContainer';
import { Sidebar } from '../sidebar/Sidebar';
import { SearchBar } from '../search/SearchBar';
import { SelectionToolbar } from '../annotations/SelectionToolbar';
import { NoteDialog } from '../annotations/NoteDialog';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useReadingState } from '../../hooks/useReadingState';
import { useZenMode } from '../../hooks/useZenMode';

export function PDFViewer() {
  const document = useDocumentStore((s) => s.document);
  const isLoading = useDocumentStore((s) => s.isLoading);
  const error = useDocumentStore((s) => s.error);
  
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const uiVisible = useUIStore((s) => s.uiVisible);

  useKeyboardShortcuts();
  useReadingState();
  useZenMode();

  if (error) {
    return (
      <div className="viewer-error">
        <div className="viewer-error-content">
          <ErrorIcon />
          <h2>Failed to load PDF</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="viewer-loading">
        <div className="viewer-loading-spinner" />
        <p>Loading document…</p>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <div className={`pdf-viewer ${!uiVisible ? 'zen-mode' : ''}`}>
      <div className={`ui-overlay ${uiVisible ? 'ui-visible' : 'ui-hidden'}`}>
        <ViewerToolbar />
        <SearchBar eventBus={null} />
        {sidebarOpen && <Sidebar />}
      </div>
      
      <ScrollContainer />
      
      <SelectionToolbar />
      <NoteDialog />
    </div>
  );
}

function ErrorIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}
