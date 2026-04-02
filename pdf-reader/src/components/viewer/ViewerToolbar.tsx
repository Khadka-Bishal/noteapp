import { useUIStore } from '../../stores/uiStore';
import { useDocumentStore } from '../../stores/documentStore';
import { useState } from 'react';

export function ViewerToolbar() {
  const zoom = useUIStore((s) => s.zoom);
  const setZoom = useUIStore((s) => s.setZoom);
  const activePage = useUIStore((s) => s.activePage);
  const setActivePage = useUIStore((s) => s.setActivePage);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const searchOpen = useUIStore((s) => s.searchOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const pageCount = useDocumentStore((s) => s.pageCount);
  const document = useDocumentStore((s) => s.document);
  const toolMode = useUIStore((s) => s.toolMode);
  const setToolMode = useUIStore((s) => s.setToolMode);

  const [pageInput, setPageInput] = useState('');

  const handleZoomIn = () => setZoom(zoom + 25);
  const handleZoomOut = () => setZoom(zoom - 25);
  const handleFitWidth = () => {
    const container = window.document.getElementById('scroll-container');
    if (!container) return;
    // Approximate fit-width: 95% of container width / default page width * 100
    const containerWidth = container.clientWidth - 48; // padding
    const estimatedPageWidth = 612; // US Letter width in points
    const fitZoom = Math.round((containerWidth / estimatedPageWidth) * 100);
    setZoom(fitZoom);
  };

  const handlePageJump = () => {
    const page = parseInt(pageInput, 10);
    if (page >= 1 && page <= pageCount) {
      setActivePage(page);
      const el = window.document.getElementById(`page-${page}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setPageInput('');
    }
  };

  return (
    <div className="viewer-toolbar" role="toolbar" aria-label="Viewer controls">
      {/* Left: sidebar toggle + document title */}
      <div className="toolbar-left">
        <button
          className="toolbar-btn"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <SidebarIcon />
        </button>
        {document && (
          <span className="toolbar-title" title={document.title || document.fileName}>
            {document.title || document.fileName}
          </span>
        )}
      </div>

      {/* Center: page navigation + zoom */}
      <div className="toolbar-center">
        <div className="toolbar-group mode-switcher">
          <button
            className={`toolbar-btn ${toolMode === 'text' ? 'toolbar-btn-active' : ''}`}
            onClick={() => setToolMode('text')}
            title="Text Selection Mode"
          >
            <TextCursorIcon />
          </button>
          <button
            className={`toolbar-btn ${toolMode === 'draw' ? 'toolbar-btn-active' : ''}`}
            onClick={() => setToolMode('draw')}
            title="Brush Draw Mode"
          >
            <BrushIcon />
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <span className="toolbar-page-info">
            {activePage} / {pageCount}
          </span>
          <input
            className="toolbar-page-input"
            type="text"
            placeholder="Go to…"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePageJump()}
            aria-label="Jump to page"
            size={4}
          />
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={handleZoomOut} aria-label="Zoom out" title="Zoom out">
            <MinusIcon />
          </button>
          <span className="toolbar-zoom-value">{zoom}%</span>
          <button className="toolbar-btn" onClick={handleZoomIn} aria-label="Zoom in" title="Zoom in">
            <PlusIcon />
          </button>
          <button className="toolbar-btn" onClick={handleFitWidth} aria-label="Fit width" title="Fit width">
            <FitWidthIcon />
          </button>
        </div>
      </div>

      {/* Right: search + notes panel */}
      <div className="toolbar-right">
        <button
          className="toolbar-btn"
          onClick={() => setSearchOpen(!searchOpen)}
          aria-label="Search in document"
          title="Search (Ctrl+F)"
        >
          <SearchIcon />
        </button>
      </div>
    </div>
  );
}

/* --- Inline SVG Icons --- */
function SidebarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function FitWidthIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function NotesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function TextCursorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M5 4h14M5 20h14M12 4v16" />
    </svg>
  );
}

function BrushIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  );
}
