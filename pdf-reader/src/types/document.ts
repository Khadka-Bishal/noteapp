// ---- Document types ----

export interface PDFDocumentMeta {
  id: string;               // SHA-256 hash of PDF binary
  title: string;
  fileName: string;
  fileSize: number;          // bytes
  pageCount: number;
  createdAt: string;         // ISO
  lastOpenedAt: string;      // ISO
  outline: OutlineItem[];
  opfsPath: string;
}

export interface OutlineItem {
  title: string;
  dest: string | unknown[];  // PDF.js destination ref
  children: OutlineItem[];
}

// ---- Reading state ----

export interface ReadingState {
  documentId: string;
  currentPage: number;
  scrollPosition: number;
  zoomLevel: number;         // percentage
  viewMode: ViewMode;
  sidebarOpen: boolean;
  sidebarTab: SidebarTab;
  updatedAt: string;
}

export type ViewMode = 'continuous' | 'paged';
export type SidebarTab = 'outline' | 'pages' | 'notes';
