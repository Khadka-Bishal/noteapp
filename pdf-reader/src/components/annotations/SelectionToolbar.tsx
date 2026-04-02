import { useUIStore } from '../../stores/uiStore';
import { useTextSelection } from '../../hooks/useTextSelection';

export function SelectionToolbar() {
  const visible = useUIStore((s) => s.selectionToolbarVisible);
  const position = useUIStore((s) => s.selectionToolbarPosition);
  const activeColor = useUIStore((s) => s.activeHighlightColor);
  const setNoteDialog = useUIStore((s) => s.setNoteDialog);
  const hideSelectionToolbar = useUIStore((s) => s.hideSelectionToolbar);
  const { createHighlight } = useTextSelection();

  if (!visible || !position) return null;

  const handleHighlight = () => {
    createHighlight(activeColor);
  };

  const handleNote = () => {
    setNoteDialog(true, position);
    hideSelectionToolbar();
  };

  return (
    <div
      className="selection-toolbar"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="selection-toolbar-inner popup-menu">
        <button
          className="selection-menu-item"
          onClick={handleNote}
        >
          <NoteIcon />
          <span>Add Note</span>
        </button>
        <div className="selection-divider-vertical" />
        <button
          className="selection-menu-item"
          onClick={handleHighlight}
        >
          <HighlightIcon />
          <span>Highlight</span>
        </button>
      </div>
    </div>
  );
}

function NoteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function HighlightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
