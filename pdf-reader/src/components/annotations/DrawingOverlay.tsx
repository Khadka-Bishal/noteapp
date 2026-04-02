import { useState, useRef, useEffect, useCallback } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useAnnotationStore } from '../../stores/annotationStore';
import { useDocumentStore } from '../../stores/documentStore';
import type { Annotation, HighlightColor } from '../../types/annotation';
import { v4 as uuidv4 } from 'uuid';

interface DrawingOverlayProps {
  pageNumber: number;
}

const COLOR_MAP: Record<HighlightColor, string> = {
  yellow: 'var(--highlight-yellow)',
  green: 'var(--highlight-green)',
  blue: 'var(--highlight-blue)',
  pink: 'var(--highlight-pink)',
  orange: 'var(--highlight-orange)',
};

export function DrawingOverlay({ pageNumber }: DrawingOverlayProps) {
  const toolMode = useUIStore((s) => s.toolMode);
  const activeColor = useUIStore((s) => s.activeHighlightColor);
  const document = useDocumentStore((s) => s.document);
  const annotations = useAnnotationStore((s) => s.annotations);
  const setAnnotations = useAnnotationStore((s) => s.setAnnotations);
  
  const [currentStroke, setCurrentStroke] = useState<{x: number, y: number}[] | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const pageDrawings = annotations.filter(
    (a) => a.anchor.pageNumber === pageNumber && a.type === 'draw'
  );

  const getCoordinates = (e: React.PointerEvent) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (toolMode !== 'draw') return;
    e.preventDefault();
    (e.target as Element).releasePointerCapture(e.pointerId); // Prevent default dragging
    const coords = getCoordinates(e);
    if (coords) setCurrentStroke([coords]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (toolMode !== 'draw' || !currentStroke) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    if (coords) setCurrentStroke(prev => [...(prev || []), coords]);
  };

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (toolMode !== 'draw' || !currentStroke || !document) return;
    e.preventDefault();
    
    if (currentStroke.length > 2) {
      // Save annotation
      const newAnnotation: Annotation = {
        id: uuidv4(),
        documentId: document.id,
        type: 'draw',
        anchor: {
          pageNumber,
          startOffset: 0,
          endOffset: 0,
          exactText: '',
          prefixContext: '',
          suffixContext: '',
          rects: [],
        },
        color: activeColor,
        noteText: null,
        repeatedTermLinkId: null,
        isRepeatedInstance: false,
        drawingPoints: [currentStroke],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setAnnotations([...annotations, newAnnotation]);
      
      // Also save to indexedDB incrementally (usually handled by debounced save if we had one)
      // We rely on the store's global persist logic or we can trigger a manual save
    }
    
    setCurrentStroke(null);
  }, [toolMode, currentStroke, document, pageNumber, activeColor, annotations, setAnnotations]);

  // Generate SVG path data from array of points
  const pointsToPath = (points: {x: number, y: number}[]) => {
    if (!points || points.length === 0) return '';
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return d;
  };

  return (
    <svg
      ref={svgRef}
      className="drawing-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: toolMode === 'draw' ? 'all' : 'none',
        zIndex: toolMode === 'draw' ? 10 : 1,
        touchAction: toolMode === 'draw' ? 'none' : 'auto',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Existing Drawings */}
      {pageDrawings.map((drawAn) => (
        <g key={drawAn.id} opacity={0.5} style={{ mixBlendMode: 'multiply' }}>
          {drawAn.drawingPoints?.map((stroke, i) => (
            <path
              key={i}
              d={pointsToPath(stroke)}
              fill="none"
              stroke={COLOR_MAP[drawAn.color] || COLOR_MAP.yellow}
              strokeWidth="2.5%"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </g>
      ))}

      {/* Current Stroke in Progress */}
      {currentStroke && (
        <path
          d={pointsToPath(currentStroke)}
          fill="none"
          stroke={COLOR_MAP[activeColor] || COLOR_MAP.yellow}
          strokeWidth="2.5%"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.5}
          style={{ mixBlendMode: 'multiply' }}
        />
      )}
    </svg>
  );
}
