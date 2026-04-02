import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { OutlineItem } from '../../types/document';

interface PDFOutlineItem {
  title: string;
  dest: string | unknown[] | null;
  items: PDFOutlineItem[];
}

/**
 * Extract the document outline (bookmarks/table of contents) from a PDF.
 * Returns a hierarchical tree of outline items.
 */
export async function extractOutline(
  pdfDoc: PDFDocumentProxy
): Promise<OutlineItem[]> {
  const outline = await pdfDoc.getOutline();
  if (!outline) return [];
  return mapOutlineItems(outline as PDFOutlineItem[]);
}

function mapOutlineItems(items: PDFOutlineItem[]): OutlineItem[] {
  return items.map((item) => ({
    title: item.title || 'Untitled',
    dest: item.dest ?? '',
    children: item.items ? mapOutlineItems(item.items) : [],
  }));
}
