import type { Anchor, AnchorRect } from '../../types/annotation';

/**
 * Captures the current text selection and converts it into an Anchor.
 * Returns null if no text is selected within the PDF viewer.
 */
export function captureSelectionAnchor(): {
  anchor: Anchor;
  selectionRects: DOMRect[];
} | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.rangeCount) return null;

  const range = selection.getRangeAt(0);

  // Find the page container that contains the selection
  const pageContainer = findPageContainer(range.commonAncestorContainer);
  if (!pageContainer) return null;

  const pageNumber = parseInt(pageContainer.dataset.pageNumber || '0', 10);
  if (pageNumber === 0) return null;

  // Get the exact selected text
  const exactText = selection.toString().trim();
  if (!exactText) return null;

  // Get the text layer within this page
  const textLayer = pageContainer.querySelector('.textLayer');
  if (!textLayer) return null;

  // Calculate character offsets within the text layer's full text content
  const fullText = textLayer.textContent || '';
  const startOffset = getTextOffset(textLayer, range.startContainer, range.startOffset);
  const endOffset = getTextOffset(textLayer, range.endContainer, range.endOffset);

  // Get context strings for re-anchoring
  const prefixContext = fullText.slice(Math.max(0, startOffset - 40), startOffset);
  const suffixContext = fullText.slice(endOffset, endOffset + 40);

  // Get selection rects relative to the page container
  const selectionRects = Array.from(range.getClientRects());
  const containerRect = pageContainer.getBoundingClientRect();

  // Convert to percentage-based rects (zoom-independent)
  const rects: AnchorRect[] = selectionRects
    .filter((r) => r.width > 0 && r.height > 0)
    .map((r) => ({
      x: ((r.left - containerRect.left) / containerRect.width) * 100,
      y: ((r.top - containerRect.top) / containerRect.height) * 100,
      width: (r.width / containerRect.width) * 100,
      height: (r.height / containerRect.height) * 100,
    }));

  if (rects.length === 0) return null;

  return {
    anchor: {
      pageNumber,
      startOffset,
      endOffset,
      exactText,
      prefixContext,
      suffixContext,
      rects,
    },
    selectionRects,
  };
}

/**
 * Finds the .page-container ancestor of a DOM node.
 */
function findPageContainer(node: Node): HTMLElement | null {
  let current: Node | null = node;
  while (current) {
    if (
      current instanceof HTMLElement &&
      current.classList.contains('page-container')
    ) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

/**
 * Calculates the character offset of a DOM range point within the text layer.
 */
function getTextOffset(root: Element, node: Node, offset: number): number {
  let charCount = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    if (textNode === node) {
      return charCount + offset;
    }
    charCount += (textNode.textContent || '').length;
  }

  return charCount;
}

/**
 * Computes the position (center of the selection bounding box)
 * to place a floating toolbar.
 */
export function getSelectionToolbarPosition(
  selectionRects: DOMRect[]
): { x: number; y: number } | null {
  if (selectionRects.length === 0) return null;

  const firstRect = selectionRects[0];
  const lastRect = selectionRects[selectionRects.length - 1];

  // Position above the selection, horizontally centered
  const x = (firstRect.left + lastRect.right) / 2;
  const y = firstRect.top - 8; // 8px above the selection

  return { x, y };
}
