/**
 * Normalize text for term matching.
 * - lowercase
 * - collapse whitespace
 * - trim
 */
export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Truncate text to maxLen, appending ellipsis if truncated.
 */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '…';
}
