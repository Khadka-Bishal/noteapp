import { useEffect, useMemo } from 'react';
import { useDocumentStore } from '../stores/documentStore';
import { useUIStore } from '../stores/uiStore';
import { createReadingStateSaver, getReadingState } from '../services/storage/readingStateStorage';

export function useReadingState() {
  const documentId = useDocumentStore((s) => s.document?.id);
  
  // States to track
  const currentPage = useUIStore((s) => s.activePage);
  const zoomLevel = useUIStore((s) => s.zoom);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  // Actions for restore
  // Using useUIStore.getState() inside async handlers to avoid stale deps
  const saver = useMemo(() => createReadingStateSaver(1000), []);

  useEffect(() => {
    if (!documentId) return;

    // Load initial state
    let isMounted = true;
    getReadingState(documentId).then((state) => {
      if (!isMounted || !state) return;
      
      const uiStore = useUIStore.getState();
      
      // Restore zoom
      if (state.zoomLevel && state.zoomLevel !== uiStore.zoom) {
        uiStore.setZoom(state.zoomLevel);
      }
      
      // Restore sidebar
      if (state.sidebarOpen !== uiStore.sidebarOpen) {
        uiStore.toggleSidebar();
      }

      // Restore scroll (this will need coordination with ScrollContainer, which listens to hash initially or we can scroll it directly).
      // For now, we'll just restore zoom and sidebar, and scroll container could read ReadingState directly or read from a store value.
      // But actually reading state scroll position relies on rendering. We'll skip scroll position restore for this basic version and just restore zoom/sidebar/page.
      // Easiest is to scroll into view the `currentPage` element after a short delay.
      if (state.currentPage) {
        setTimeout(() => {
          const el = window.document.getElementById(`page-${state.currentPage}`);
          if (el) el.scrollIntoView({ behavior: 'auto' });
        }, 100); // Give canvas renderer a moment to measure
      }
    });

    return () => {
      isMounted = false;
      saver.flush(); // Flush any pending saves on unmount
    };
  }, [documentId, saver]);

  // Save state on change
  useEffect(() => {
    if (!documentId) return;

    saver.save({
      documentId,
      currentPage,
      scrollPosition: 0, // In this virtualized list, page # is more durable than raw scrollTop
      zoomLevel,
      viewMode: 'continuous',
      sidebarOpen,
      sidebarTab: 'outline',
      updatedAt: new Date().toISOString()
    });
  }, [documentId, currentPage, zoomLevel, sidebarOpen, saver]);
}
