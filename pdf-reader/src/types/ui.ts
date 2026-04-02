import type { SidebarTab, ViewMode } from './document';
import type { HighlightColor } from './annotation';

// ---- UI state types ----

export interface SearchState {
  isOpen: boolean;
  query: string;
  matchCount: number;
  currentMatch: number;
}

export type AnnotationFilter = 'all' | 'highlights' | 'notes';

export interface UIState {
  // Viewer
  zoom: number;
  viewMode: ViewMode;
  activePage: number;

  // Sidebar
  sidebarOpen: boolean;
  sidebarTab: SidebarTab;

  // Note panel
  notePanelOpen: boolean;
  annotationFilter: AnnotationFilter;

  // Search
  search: SearchState;

  // Selection toolbar
  selectionToolbarVisible: boolean;
  selectionToolbarPosition: { x: number; y: number } | null;
  activeHighlightColor: HighlightColor;

  // App-level
  isDraggingFile: boolean;
}
