import { useMemo } from 'react';
import { useAnnotationStore } from '../../stores/annotationStore';
import type { Annotation, HighlightColor } from '../../types/annotation';

interface HighlightOverlayProps {
  pageNumber: number;
}

const COLOR_MAP: Record<HighlightColor, string> = {
  yellow: 'var(--highlight-yellow)',
  green: 'var(--highlight-green)',
  blue: 'var(--highlight-blue)',
  pink: 'var(--highlight-pink)',
  orange: 'var(--highlight-orange)',
};

export function HighlightOverlay({ pageNumber }: HighlightOverlayProps) {
  const annotations = useAnnotationStore((s) => s.annotations);

  const pageAnnotations = useMemo(
    () => annotations.filter((a) => a.anchor.pageNumber === pageNumber),
    [annotations, pageNumber]
  );

  if (pageAnnotations.length === 0) return null;

  return (
    <>
      {pageAnnotations.map((annotation) => (
        <HighlightRects key={annotation.id} annotation={annotation} />
      ))}
    </>
  );
}

function HighlightRects({ annotation }: { annotation: Annotation }) {
  const color = COLOR_MAP[annotation.color] || COLOR_MAP.yellow;
  const setActiveAnnotation = useAnnotationStore((s) => s.setActiveAnnotation);

  const handleClick = () => {
    setActiveAnnotation(annotation.id);
  };

  return (
    <>
      {annotation.anchor.rects.map((rect, i) => (
        <div
          key={`${annotation.id}-${i}`}
          className={`highlight-rect highlight-${annotation.type}`}
          style={{
            position: 'absolute',
            left: `${rect.x}%`,
            top: `${rect.y}%`,
            width: `${rect.width}%`,
            height: `${rect.height}%`,
            backgroundColor: color,
            opacity: 0.35,
            mixBlendMode: 'multiply',
            borderRadius: '2px',
            cursor: 'pointer',
            pointerEvents: 'all',
            transition: 'opacity 150ms ease',
          }}
          onClick={handleClick}
          title={annotation.noteText || annotation.anchor.exactText}
          data-annotation-id={annotation.id}
        />
      ))}
      {annotation.type === 'note' && annotation.anchor.rects.length > 0 && (
        <div
          className="note-indicator"
          style={{
            position: 'absolute',
            left: `${annotation.anchor.rects[0].x + annotation.anchor.rects[0].width}%`,
            top: `${annotation.anchor.rects[0].y}%`,
          }}
          onClick={handleClick}
          title="Has note"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-accent)" stroke="none">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
      )}
    </>
  );
}
