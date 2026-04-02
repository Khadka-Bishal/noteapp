// ---- Anchor (position within a PDF page) ----

export interface AnchorRect {
  x: number;       // percentage of page width (0–100)
  y: number;       // percentage of page height (0–100)
  width: number;   // percentage
  height: number;  // percentage
}

export interface Anchor {
  pageNumber: number;        // 1-indexed
  startOffset: number;       // char offset in page text content
  endOffset: number;
  exactText: string;
  prefixContext: string;     // ~30 chars before
  suffixContext: string;     // ~30 chars after
  rects: AnchorRect[];       // zoom-independent positions
}

// ---- Annotation ----

export type AnnotationType = 'highlight' | 'underline' | 'note' | 'draw';

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';

export interface Annotation {
  id: string;                // UUID v4
  documentId: string;        // SHA-256 hash
  type: AnnotationType;
  anchor: Anchor;
  color: HighlightColor;
  noteText: string | null;
  repeatedTermLinkId: string | null;
  isRepeatedInstance: boolean;
  drawingPoints?: { x: number; y: number }[][]; // For raw SVG path points
  createdAt: string;
  updatedAt: string;
}

// ---- Repeated term link ----

export interface RepeatedTermLink {
  id: string;
  documentId: string;
  normalizedTerm: string;
  originalAnnotationId: string;
  matchedAnnotationIds: string[];
  createdAt: string;
}

// ---- Export job ----

export type ExportFormat = 'json' | 'markdown';

export interface ExportJob {
  id: string;
  documentId: string;
  format: ExportFormat;
  createdAt: string;
  content: string;
}
