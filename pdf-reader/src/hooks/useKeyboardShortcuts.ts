import { useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useDocumentStore } from '../stores/documentStore';

/**
 * Hook for global keyboard shortcuts.
 * Mount once in the app shell.
 */
export function useKeyboardShortcuts() {
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setZoom = useUIStore((s) => s.setZoom);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Cmd/Ctrl+F — Search (handled by SearchBar, but also toggle open)
      // (SearchBar handles this internally)

      // Cmd/Ctrl+B — Toggle sidebar
      if (isMod && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      if (isMod && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Skip remaining shortcuts if in an input field
      if (isInput) return;

      // Cmd/Ctrl+= or Cmd/Ctrl++ — Zoom in
      if (isMod && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoom(useUIStore.getState().zoom + 25);
        return;
      }

      // Cmd/Ctrl+- — Zoom out
      if (isMod && e.key === '-') {
        e.preventDefault();
        setZoom(useUIStore.getState().zoom - 25);
        return;
      }

      // Cmd/Ctrl+0 — Reset zoom to 100%
      if (isMod && e.key === '0') {
        e.preventDefault();
        setZoom(100);
        return;
      }

      // G — Jump to page (focus page input)
      if (e.key === 'g' && !isMod) {
        const pageInput = document.querySelector<HTMLInputElement>('.toolbar-page-input');
        if (pageInput) {
          e.preventDefault();
          pageInput.focus();
          pageInput.select();
        }
        return;
      }

      // Arrow keys — scroll (browser handles this natively in scroll container)
      // Page navigation
      const pageCount = useDocumentStore.getState().pageCount;

      // Home — Go to first page
      if (e.key === 'Home') {
        e.preventDefault();
        const el = document.getElementById('page-1');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      // End — Go to last page
      if (e.key === 'End') {
        e.preventDefault();
        const el = document.getElementById(`page-${pageCount}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setSearchOpen, toggleSidebar, setZoom]);
}
