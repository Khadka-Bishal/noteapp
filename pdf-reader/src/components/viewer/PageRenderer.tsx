import { useEffect, useRef, useCallback, useState } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import * as pdfjsLib from 'pdfjs-dist';
import { useDocumentStore } from '../../stores/documentStore';
import { useUIStore } from '../../stores/uiStore';
import { HighlightOverlay } from '../annotations/HighlightOverlay';
import { DrawingOverlay } from '../annotations/DrawingOverlay';

interface PageRendererProps {
  pageNumber: number;
  isVisible: boolean;
  onPageVisible?: (pageNumber: number) => void;
}

export function PageRenderer({ pageNumber, isVisible, onPageVisible }: PageRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const annotationLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<ReturnType<PDFPageProxy['render']> | null>(null);
  const isRenderingRef = useRef(false);
  const renderGenRef = useRef(0); // generation counter to skip stale renders

  const pdfDoc = useDocumentStore((s) => s.pdfDoc);
  const zoom = useUIStore((s) => s.zoom);
  const toolMode = useUIStore((s) => s.toolMode);

  const [pageDimensions, setPageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [rendered, setRendered] = useState(false);

  // Get page dimensions on mount
  useEffect(() => {
    if (!pdfDoc) return;
    let cancelled = false;

    pdfDoc.getPage(pageNumber).then((page) => {
      if (cancelled) return;
      const viewport = page.getViewport({ scale: 1 });
      setPageDimensions({ width: viewport.width, height: viewport.height });
    });

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNumber]);

  // Handle internal PDF links
  const handleInternalLink = useCallback(
    async (dest: unknown) => {
      if (!pdfDoc) return;

      try {
        let destArray: unknown[] | null = null;

        if (typeof dest === 'string') {
          destArray = await pdfDoc.getDestination(dest);
        } else if (Array.isArray(dest)) {
          destArray = dest;
        }

        if (!destArray || destArray.length === 0) return;

        const ref = destArray[0];
        const pageIndex = await pdfDoc.getPageIndex(ref as { num: number; gen: number });
        const targetPage = pageIndex + 1;

        // Scroll to target page
        const targetEl = document.getElementById(`page-${targetPage}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        useUIStore.getState().setActivePage(targetPage);
      } catch (err) {
        console.error('Error navigating to destination:', err);
      }
    },
    [pdfDoc]
  );

  // Render page when visible
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || !textLayerRef.current || !isVisible) return;

    // Skip if already rendering — the generation counter will handle re-render after
    if (isRenderingRef.current) return;

    // Cancel any existing render task first
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // ignore cancel errors
      }
      renderTaskRef.current = null;
    }

    const gen = ++renderGenRef.current;
    isRenderingRef.current = true;

    try {
      const page = await pdfDoc.getPage(pageNumber);

      // Check if this render is still current
      if (gen !== renderGenRef.current) return;

      const scale = (zoom / 100) * (window.devicePixelRatio || 1);
      const displayScale = zoom / 100;
      const viewport = page.getViewport({ scale });
      const displayViewport = page.getViewport({ scale: displayScale });

      // Setup canvas
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear and resize canvas before render
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${displayViewport.width}px`;
      canvas.style.height = `${displayViewport.height}px`;

      // Render canvas
      const renderTask = page.render({
        canvasContext: ctx,
        canvas,
        viewport,
      } as any);
      renderTaskRef.current = renderTask;
      await renderTask.promise;

      // Check if still current
      if (gen !== renderGenRef.current) return;

      // Render text layer
      const textContent = await page.getTextContent();
      const textLayerDiv = textLayerRef.current;
      if (!textLayerDiv) return;
      textLayerDiv.innerHTML = '';
      textLayerDiv.style.width = `${displayViewport.width}px`;
      textLayerDiv.style.height = `${displayViewport.height}px`;

      const textLayer = new pdfjsLib.TextLayer({
        textContentSource: textContent,
        container: textLayerDiv,
        viewport: displayViewport,
      });
      await textLayer.render();

      // Render PDF annotation layer (native links)
      const annotations = await page.getAnnotations({ intent: 'display' });
      const annotationLayerDiv = annotationLayerRef.current;
      if (annotationLayerDiv && gen === renderGenRef.current) {
        annotationLayerDiv.innerHTML = '';
        annotationLayerDiv.style.width = `${displayViewport.width}px`;
        annotationLayerDiv.style.height = `${displayViewport.height}px`;

        for (const annotation of annotations) {
          if (annotation.subtype === 'Link' && annotation.rect) {
            const [x1, y1, x2, y2] = annotation.rect;
            const rect = displayViewport.convertToViewportRectangle([x1, y1, x2, y2]);
            const [left, top] = [Math.min(rect[0], rect[2]), Math.min(rect[1], rect[3])];
            const width = Math.abs(rect[2] - rect[0]);
            const height = Math.abs(rect[3] - rect[1]);

            const linkEl = document.createElement('a');
            linkEl.style.position = 'absolute';
            linkEl.style.left = `${left}px`;
            linkEl.style.top = `${top}px`;
            linkEl.style.width = `${width}px`;
            linkEl.style.height = `${height}px`;
            linkEl.style.cursor = 'pointer';

            if (annotation.url) {
              linkEl.href = annotation.url;
              linkEl.target = '_blank';
              linkEl.rel = 'noopener noreferrer';
            } else if (annotation.dest) {
              linkEl.href = '#';
              linkEl.dataset.dest = JSON.stringify(annotation.dest);
              const destCopy = annotation.dest;
              linkEl.addEventListener('click', (e) => {
                e.preventDefault();
                handleInternalLink(destCopy);
              });
            }

            annotationLayerDiv.appendChild(linkEl);
          }
        }
      }

      if (gen === renderGenRef.current) {
        setRendered(true);
        onPageVisible?.(pageNumber);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('Rendering cancelled')) {
        return;
      }
      if (err instanceof Error && err.message.includes('multiple render()')) {
        return; // Will retry on next visibility change
      }
      console.error(`Error rendering page ${pageNumber}:`, err);
    } finally {
      isRenderingRef.current = false;
      renderTaskRef.current = null;
    }
  }, [pdfDoc, pageNumber, zoom, isVisible, onPageVisible, handleInternalLink]);

  // Render when visible or zoom changes
  useEffect(() => {
    if (isVisible) {
      setRendered(false);
      // Small delay to let the IntersectionObserver settle
      const timeoutId = setTimeout(() => renderPage(), 16);
      return () => {
        clearTimeout(timeoutId);
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // ignore
          }
          renderTaskRef.current = null;
        }
      };
    }
  }, [isVisible, renderPage]);

  // Cleanup canvas when scrolled far away
  useEffect(() => {
    if (!isVisible && rendered && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      if (textLayerRef.current) {
        textLayerRef.current.innerHTML = '';
      }
      setRendered(false);
    }
  }, [isVisible, rendered]);

  const displayScale = zoom / 100;
  const width = pageDimensions ? pageDimensions.width * displayScale : 612 * displayScale;
  const height = pageDimensions ? pageDimensions.height * displayScale : 792 * displayScale;

  return (
    <div
      ref={containerRef}
      id={`page-${pageNumber}`}
      className="page-container"
      style={{ width: `${width}px`, height: `${height}px` }}
      data-page-number={pageNumber}
    >
      <canvas ref={canvasRef} className="page-canvas" />
      <div 
        ref={textLayerRef} 
        className="textLayer" 
        style={{ pointerEvents: toolMode === 'draw' ? 'none' : 'auto' }} 
      />
      <div ref={annotationLayerRef} className="annotation-layer" />
      <div className="custom-overlay-layer" data-page={pageNumber}>
        <HighlightOverlay pageNumber={pageNumber} />
        <DrawingOverlay pageNumber={pageNumber} />
      </div>

      {!rendered && isVisible && (
        <div className="page-loading">
          <div className="page-loading-spinner" />
        </div>
      )}

      <div className="page-number-label">{pageNumber}</div>
    </div>
  );
}
