import { useEffect, useCallback, useRef } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useAnnotationStore } from '../stores/annotationStore';
import { useDocumentStore } from '../stores/documentStore';
import {
  captureSelectionAnchor,
  getSelectionToolbarPosition,
} from '../services/annotation/anchorCapture';
import { v4 as uuid } from 'uuid';
import type { Annotation, HighlightColor } from '../types/annotation';

/**
 * Hook that listens for text selection events in the PDF viewer
 * and shows a floating toolbar to create highlights/notes.
 */
export function useTextSelection() {
  const setSelectionToolbar = useUIStore((s) => s.setSelectionToolbar);
  const activeColor = useUIStore((s) => s.activeHighlightColor);
  const documentId = useDocumentStore((s) => s.document?.id);
  const addAnnotation = useAnnotationStore((s) => s.addAnnotation);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelectionChange = useCallback(() => {
    // Debounce to avoid excessive processing
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectionToolbar(false, null);
        return;
      }

      const result = captureSelectionAnchor();
      if (!result) {
        setSelectionToolbar(false, null);
        return;
      }

      const pos = getSelectionToolbarPosition(result.selectionRects);
      if (pos) {
        setSelectionToolbar(true, pos);
      }
    }, 200);
  }, [setSelectionToolbar]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [handleSelectionChange]);

  const createHighlight = useCallback(
    (color?: HighlightColor) => {
      if (!documentId) return;

      const result = captureSelectionAnchor();
      if (!result) return;

      const annotation: Annotation = {
        id: uuid(),
        documentId,
        type: 'highlight',
        anchor: result.anchor,
        color: color || activeColor,
        noteText: null,
        repeatedTermLinkId: null,
        isRepeatedInstance: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addAnnotation(annotation);

      // Clear the browser selection
      window.getSelection()?.removeAllRanges();
      setSelectionToolbar(false, null);

      return annotation;
    },
    [documentId, activeColor, addAnnotation, setSelectionToolbar]
  );

  const createNote = useCallback(
    (noteText: string, color?: HighlightColor) => {
      if (!documentId) return;

      const result = captureSelectionAnchor();
      if (!result) return;

      const annotation: Annotation = {
        id: uuid(),
        documentId,
        type: 'note',
        anchor: result.anchor,
        color: color || activeColor,
        noteText,
        repeatedTermLinkId: null,
        isRepeatedInstance: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addAnnotation(annotation);
      window.getSelection()?.removeAllRanges();
      setSelectionToolbar(false, null);

      return annotation;
    },
    [documentId, activeColor, addAnnotation, setSelectionToolbar]
  );

  return { createHighlight, createNote };
}
