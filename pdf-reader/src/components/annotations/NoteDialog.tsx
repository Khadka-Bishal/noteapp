import { useState, useEffect, useRef } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useAnnotationStore } from '../../stores/annotationStore';
import { useDocumentStore } from '../../stores/documentStore';
import { useTextSelection } from '../../hooks/useTextSelection';

export function NoteDialog() {
  const visible = useUIStore((s) => s.noteDialogVisible);
  const position = useUIStore((s) => s.noteDialogPosition);
  const noteText = useUIStore((s) => s.noteDialogText);
  const setNoteDialog = useUIStore((s) => s.setNoteDialog);
  
  const { createHighlight } = useTextSelection();
  const updateAnnotation = useAnnotationStore((s) => s.updateAnnotation);
  const activeHighlightColor = useUIStore((s) => s.activeHighlightColor);
  
  const [text, setText] = useState(noteText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (visible) {
      setText(noteText);
      setTimeout(() => textareaRef.current?.focus(), 10);
    }
  }, [visible, noteText]);

  if (!visible || !position) return null;

  const handleSave = () => {
    // If it's a new note (from selection)
    if (!noteText) {
      const annotation = createHighlight(activeHighlightColor);
      if (annotation) {
        updateAnnotation(annotation.id, { noteText: text, type: 'note' });
      }
    } else {
      // Logic for editing existing note could go here if we wanted
    }
    setNoteDialog(false, null);
  };

  const handleCancel = () => {
    setNoteDialog(false, null);
  };

  return (
    <div
      className="note-dialog-overlay"
      onClick={handleCancel}
    >
      <div
        className="note-dialog popup-menu"
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y + 10}px`, /* Offset below selection */
          width: '280px',
          flexDirection: 'column',
          alignItems: 'stretch',
          padding: 'var(--space-3)',
          gap: 'var(--space-3)',
          pointerEvents: 'all'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <textarea
          ref={textareaRef}
          className="note-dialog-textarea"
          placeholder="Write a note..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              handleSave();
            }
          }}
        />
        <div className="note-dialog-actions">
          <button className="note-dialog-btn cancel" onClick={handleCancel}>Cancel</button>
          <button className="note-dialog-btn save" onClick={handleSave}>Save Note</button>
        </div>
      </div>
    </div>
  );
}
