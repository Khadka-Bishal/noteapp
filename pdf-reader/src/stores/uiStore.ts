import { create } from 'zustand';
import type { AnnotationFilter } from '../types/ui';
import type { ViewMode, SidebarTab } from '../types/document';
import type { HighlightColor } from '../types/annotation';

interface UIState {
  // Viewer
  zoom: number;
  viewMode: ViewMode;
  activePage: number;
  toolMode: 'text' | 'draw';

  // Sidebar
  sidebarOpen: boolean;
  sidebarTab: SidebarTab;

  annotationFilter: AnnotationFilter;

  // Search
  searchOpen: boolean;
  searchQuery: string;

  // Selection toolbar
  selectionToolbarVisible: boolean;
  selectionToolbarPosition: { x: number; y: number } | null;
  activeHighlightColor: HighlightColor;

  // Note dialog (floating near selection)
  noteDialogVisible: boolean;
  noteDialogPosition: { x: number; y: number } | null;
  noteDialogText: string;

  // Zen Mode / UI Visibility
  uiVisible: boolean;

  // Drag state
  isDraggingFile: boolean;

  // Actions
  setZoom: (zoom: number) => void;
  setViewMode: (mode: ViewMode) => void;
  setActivePage: (page: number) => void;
  setToolMode: (mode: 'text' | 'draw') => void;
  toggleSidebar: () => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setAnnotationFilter: (filter: AnnotationFilter) => void;
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectionToolbar: (visible: boolean, position: { x: number; y: number } | null) => void;
  showSelectionToolbar: (x: number, y: number) => void;
  hideSelectionToolbar: () => void;
  setHighlightColor: (color: HighlightColor) => void;
  setNoteDialog: (visible: boolean, position: { x: number; y: number } | null, text?: string) => void;
  setUIVisible: (visible: boolean) => void;
  setDraggingFile: (dragging: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  zoom: 100,
  viewMode: 'continuous',
  activePage: 1,
  toolMode: 'text',
  sidebarOpen: true,
  sidebarTab: 'outline',
  annotationFilter: 'all',
  searchOpen: false,
  searchQuery: '',
  selectionToolbarVisible: false,
  selectionToolbarPosition: null,
  activeHighlightColor: 'yellow',
  noteDialogVisible: false,
  noteDialogPosition: null,
  noteDialogText: '',
  uiVisible: true,
  isDraggingFile: false,

  setZoom: (zoom) => set({ zoom: Math.max(25, Math.min(400, zoom)) }),
  setViewMode: (viewMode) => set({ viewMode }),
  setActivePage: (activePage) => set({ activePage }),
  setToolMode: (toolMode) => set({ toolMode }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarTab: (sidebarTab) => set({ sidebarTab, sidebarOpen: true }),
  setAnnotationFilter: (annotationFilter) => set({ annotationFilter }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectionToolbar: (visible, position) =>
    set({ selectionToolbarVisible: visible, selectionToolbarPosition: position }),
  showSelectionToolbar: (x, y) =>
    set({ selectionToolbarVisible: true, selectionToolbarPosition: { x, y } }),
  hideSelectionToolbar: () =>
    set({ selectionToolbarVisible: false, selectionToolbarPosition: null }),
  setHighlightColor: (activeHighlightColor) => set({ activeHighlightColor }),
  setNoteDialog: (visible, position, text = '') =>
    set({ noteDialogVisible: visible, noteDialogPosition: position, noteDialogText: text }),
  setUIVisible: (uiVisible) => set({ uiVisible }),
  setDraggingFile: (isDraggingFile) => set({ isDraggingFile }),
}));
