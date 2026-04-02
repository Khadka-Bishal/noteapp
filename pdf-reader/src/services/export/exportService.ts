import type { Annotation } from '../../types/annotation';
import type { PDFDocumentMeta } from '../../types/document';

/**
 * Triggers a browser download of a text blob.
 */
function downloadString(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Export annotations as a JSON file.
 */
export function exportAsJSON(documentData: PDFDocumentMeta, annotations: Annotation[]) {
  const payload = {
    document: {
      title: documentData.title,
      fileName: documentData.fileName,
      id: documentData.id,
      pageCount: documentData.pageCount,
    },
    exportDate: new Date().toISOString(),
    annotations: annotations.map(a => ({
      id: a.id,
      type: a.type,
      page: a.anchor.pageNumber,
      selectedText: a.type === 'draw' ? '[Free-form Drawing]' : a.anchor.exactText,
      prefixContext: a.anchor.prefixContext,
      suffixContext: a.anchor.suffixContext,
      note: a.noteText,
      color: a.color,
      createdAt: a.createdAt,
    })),
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const safeTitle = documentData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  
  downloadString(jsonString, `${safeTitle}_annotations.json`, 'application/json');
}

/**
 * Export annotations as a Markdown document.
 */
export function exportAsMarkdown(documentData: PDFDocumentMeta, annotations: Annotation[]) {
  // Sort annotations by page, then position
  const sorted = [...annotations].sort((a, b) => {
    if (a.anchor.pageNumber !== b.anchor.pageNumber) {
      return a.anchor.pageNumber - b.anchor.pageNumber;
    }
    return a.anchor.startOffset - b.anchor.startOffset;
  });

  let markdown = `# Notes: ${documentData.title}\n\n`;
  markdown += `*Exported on ${new Date().toLocaleDateString()}*\n\n`;
  markdown += `---\n\n`;

  let currentPage = -1;

  for (const annotation of sorted) {
    if (annotation.anchor.pageNumber !== currentPage) {
      currentPage = annotation.anchor.pageNumber;
      markdown += `## Page ${currentPage}\n\n`;
    }

    if (annotation.type === 'draw') {
      markdown += `> *[Free-form Drawing]*\n\n`;
    } else {
      markdown += `> ${annotation.anchor.exactText}\n\n`;
    }

    if (annotation.noteText) {
      markdown += `**Note:** ${annotation.noteText}\n\n`;
    }
    
    // Only output if it's text or if it has a note. (If it's just a doodle without a note, maybe they still want to see it existed on that page, so we kept it)
    markdown += `---\n\n`;
  }

  const safeTitle = documentData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  downloadString(markdown, `${safeTitle}_notes.md`, 'text/markdown');
}
