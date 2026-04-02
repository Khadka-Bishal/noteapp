import { useDocumentStore } from '../../stores/documentStore';
import { useUIStore } from '../../stores/uiStore';
import type { OutlineItem } from '../../types/document';

export function OutlinePanel() {
  const outline = useDocumentStore((s) => s.outline);
  const pdfDoc = useDocumentStore((s) => s.pdfDoc);

  if (outline.length === 0) {
    return (
      <div className="outline-empty">
        <p>No outline available</p>
        <span>This PDF has no table of contents or bookmarks.</span>
      </div>
    );
  }

  const handleItemClick = async (dest: string | unknown[]) => {
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

      useUIStore.getState().setActivePage(targetPage);
      const el = document.getElementById(`page-${targetPage}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error('Error navigating to outline destination:', err);
    }
  };

  return (
    <nav className="outline-panel" aria-label="Document outline">
      <OutlineTree items={outline} onItemClick={handleItemClick} depth={0} />
    </nav>
  );
}

interface OutlineTreeProps {
  items: OutlineItem[];
  onItemClick: (dest: string | unknown[]) => void;
  depth: number;
}

function OutlineTree({ items, onItemClick, depth }: OutlineTreeProps) {
  return (
    <ul className="outline-list" style={{ paddingLeft: depth > 0 ? '16px' : '0' }}>
      {items.map((item, index) => (
        <li key={`${depth}-${index}`} className="outline-item">
          <button
            className="outline-link"
            onClick={() => onItemClick(item.dest)}
            title={item.title}
          >
            {item.title}
          </button>
          {item.children.length > 0 && (
            <OutlineTree items={item.children} onItemClick={onItemClick} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  );
}
