import { useState, useEffect, useRef, useCallback } from 'react';
import { useUIStore } from '../../stores/uiStore';

interface SearchBarProps {
  eventBus: { dispatch: (type: string, data: Record<string, unknown>) => void } | null;
}

export function SearchBar({ eventBus }: SearchBarProps) {
  const searchOpen = useUIStore((s) => s.searchOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);

  const [query, setQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [searchOpen]);

  // Listen for global Cmd/Ctrl+F
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape' && searchOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen, setSearchOpen]);

  const dispatchFind = useCallback(
    (type: string, searchQuery: string) => {
      if (!eventBus || !searchQuery) return;
      eventBus.dispatch('find', {
        source: 'search',
        type,
        query: searchQuery,
        caseSensitive: false,
        highlightAll: true,
        findPrevious: type === 'again' ? false : undefined,
      });
    },
    [eventBus]
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.length > 0) {
      dispatchFind('', value);
    }
  };

  const handleNext = () => {
    dispatchFind('again', query);
    setCurrentMatch((prev) => Math.min(prev + 1, matchCount));
  };

  const handlePrev = () => {
    if (!eventBus || !query) return;
    eventBus.dispatch('find', {
      source: 'search',
      type: 'again',
      query,
      caseSensitive: false,
      highlightAll: true,
      findPrevious: true,
    });
    setCurrentMatch((prev) => Math.max(prev - 1, 1));
  };

  const handleClose = () => {
    setSearchOpen(false);
    setQuery('');
    setMatchCount(0);
    setCurrentMatch(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!searchOpen) return null;

  return (
    <div className="search-bar" role="search" aria-label="Find in document">
      <div className="search-bar-inner">
        <SearchIcon />
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Find in document…"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Search query"
        />
        {query && (
          <span className="search-match-count">
            {matchCount > 0 ? `${currentMatch} / ${matchCount}` : 'No matches'}
          </span>
        )}
        <button
          className="search-nav-btn"
          onClick={handlePrev}
          disabled={!query}
          aria-label="Previous match"
          title="Previous (Shift+Enter)"
        >
          <ChevronUpIcon />
        </button>
        <button
          className="search-nav-btn"
          onClick={handleNext}
          disabled={!query}
          aria-label="Next match"
          title="Next (Enter)"
        >
          <ChevronDownIcon />
        </button>
        <button
          className="search-close-btn"
          onClick={handleClose}
          aria-label="Close search"
          title="Close (Escape)"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
