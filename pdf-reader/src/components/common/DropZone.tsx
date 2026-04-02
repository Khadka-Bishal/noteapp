import { useRef, useCallback, useState, type DragEvent, type ReactNode } from 'react';

interface DropZoneProps {
  onFileDrop: (file: File) => void;
  onFileSelect: (file: File) => void;
  onUrlImport?: (url: string) => void;
  isDragging: boolean;
  setDragging: (d: boolean) => void;
  children?: ReactNode;
}

export function DropZone({
  onFileDrop,
  onFileSelect,
  onUrlImport,
  isDragging,
  setDragging,
  children,
}: DropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(true);
    },
    [setDragging]
  );

  const handleDragLeave = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
    },
    [setDragging]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          onFileDrop(file);
        }
      }
    },
    [onFileDrop, setDragging]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
        // Reset so the same file can be selected again
        e.target.value = '';
      }
    },
    [onFileSelect]
  );

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`drop-zone ${isDragging ? 'drop-zone-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={openFilePicker}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openFilePicker();
        }
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        className="visually-hidden"
        aria-label="Select PDF file"
      />

      <div className="drop-zone-content">
        <div className="drop-zone-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>

        <h2 className="drop-zone-title">Open a PDF</h2>
        <p className="drop-zone-subtitle">
          Drag and drop a PDF file here, or click to browse
        </p>

        <button className="drop-zone-btn" tabIndex={-1}>
          Choose File
        </button>

        {onUrlImport && (
          <form 
            className="drop-zone-url-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (urlInput.trim()) {
                onUrlImport(urlInput.trim());
                setUrlInput('');
              }
            }}
          >
            <input
              type="url"
              className="drop-zone-url-input"
              placeholder="Or paste a PDF URL here..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <button type="submit" className="drop-zone-url-btn" disabled={!urlInput.trim()}>
              Import
            </button>
          </form>
        )}

        {children}
      </div>

      {isDragging && (
        <div className="drop-zone-overlay">
          <div className="drop-zone-overlay-content">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round">
              <polyline points="16 16 12 12 8 16" />
              <line x1="12" y1="12" x2="12" y2="21" />
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
            </svg>
            <p>Drop PDF here</p>
          </div>
        </div>
      )}
    </div>
  );
}
