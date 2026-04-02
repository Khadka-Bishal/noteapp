import { useRef, useEffect, useState, useCallback } from 'react';
import { useDocumentStore } from '../../stores/documentStore';
import { useUIStore } from '../../stores/uiStore';
import { PageRenderer } from './PageRenderer';

/**
 * ScrollContainer — provides continuous scroll with page virtualization.
 * Only renders pages within ±BUFFER_PAGES of the visible viewport.
 */
const BUFFER_PAGES = 3;

export function ScrollContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const topMostPageRef = useRef(1);
  const pageCount = useDocumentStore((s) => s.pageCount);
  const zoom = useUIStore((s) => s.zoom);

  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1, 2, 3]));

  // Setup IntersectionObserver for page visibility
  useEffect(() => {
    const container = containerRef.current;
    if (!container || pageCount === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let topMostVisible = Infinity;

        setVisiblePages((prev) => {
          const next = new Set(prev);

          for (const entry of entries) {
            const pageNum = parseInt(
              (entry.target as HTMLElement).dataset.pageNumber || '0',
              10
            );
            if (pageNum === 0) continue;

            if (entry.isIntersecting) {
              for (
                let i = Math.max(1, pageNum - BUFFER_PAGES);
                i <= Math.min(pageCount, pageNum + BUFFER_PAGES);
                i++
              ) {
                next.add(i);
              }
              if (pageNum < topMostVisible) {
                topMostVisible = pageNum;
              }
            }
          }

          return next;
        });

        // Update active page outside of setState to avoid setState-during-render
        if (topMostVisible !== Infinity) {
          topMostPageRef.current = topMostVisible;
          requestAnimationFrame(() => {
            useUIStore.getState().setActivePage(topMostVisible);
          });
        }
      },
      {
        root: container,
        rootMargin: '200px 0px',
        threshold: 0.01,
      }
    );

    // Observe all page containers
    const pageElements = container.querySelectorAll('.page-container');
    pageElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [pageCount, zoom]);

  const handlePageVisible = useCallback((pageNumber: number) => {
    // Could be used for reading state persistence
  }, []);

  if (pageCount === 0) return null;

  return (
    <div ref={containerRef} className="scroll-container" id="scroll-container">
      <div className="pages-wrapper">
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
          <PageRenderer
            key={pageNum}
            pageNumber={pageNum}
            isVisible={visiblePages.has(pageNum)}
            onPageVisible={handlePageVisible}
          />
        ))}
      </div>
    </div>
  );
}
